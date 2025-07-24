// tests/media.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { MediaService } from '../src/services/media.service';
import { prisma } from '../src/lib/prisma';
import type { UserProfileData, MediaItem } from '../src/types';
import { POST as uploadApiRoute } from '../src/app/api/upload/route';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const mediaService = new MediaService();
const testFileName = 'e2e-test-image.png';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');

let testUser: UserProfileData;
let createdMediaItem: MediaItem | undefined;
let createdFilePath: string | undefined;

// Helper to create a mock file for upload
async function createMockFile(fileName: string, content: string): Promise<Buffer> {
    const buffer = Buffer.from(content, 'base64');
    return buffer;
}

test.describe('Media Library E2E Upload Test', () => {

    test.before(async () => {
        // Media items require an uploader (user)
        testUser = await prisma.user.create({
            data: {
                fullName: 'Media Upload Test User',
                email: 'media.upload.test@example.com',
                password: 'password',
                habilitationStatus: 'HABILITADO',
                accountType: 'PHYSICAL',
            }
        });
        // Ensure upload directory exists
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    });
    
    test.after(async () => {
        try {
            // Clean up database records
            if (createdMediaItem) {
                 await prisma.mediaItem.deleteMany({ where: { uploadedBy: testUser.id } });
            }
            if (testUser) {
                await prisma.user.delete({ where: { id: testUser.id } });
            }
            // Clean up physical file
            if (createdFilePath && await fs.stat(createdFilePath).catch(() => false)) {
                await fs.unlink(createdFilePath);
            }
        } catch (error) {
            console.error("Cleanup error in media test:", error);
        }
        await prisma.$disconnect();
    });

    test('should upload a file via API, create a media item record, and save the file', async () => {
        // Arrange
        const imageContentBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 black PNG
        const imageBuffer = await createMockFile(testFileName, imageContentBase64);
        const file = new File([imageBuffer], testFileName, { type: 'image/png' });

        const formData = new FormData();
        formData.append('files', file);
        formData.append('userId', testUser.id);
        formData.append('path', 'media');
        
        // Mock NextRequest
        const request = new NextRequest('http://localhost/api/upload', {
            method: 'POST',
            body: formData,
        });

        // Act
        const response = await uploadApiRoute(request);
        const result = await response.json();

        // Assert: API Response
        assert.strictEqual(response.status, 200, 'API should respond with status 200');
        assert.strictEqual(result.success, true, 'API response success should be true');
        assert.ok(result.items && result.items.length > 0, 'API should return the created items');
        assert.ok(result.urls && result.urls.length > 0, 'API should return the public URL');
        
        createdMediaItem = result.items[0];
        createdFilePath = path.join(UPLOAD_DIR, path.basename(result.urls[0]));


        // Assert: Verify directly in the database
        const createdItemFromDb = await prisma.mediaItem.findUnique({
            where: { id: createdMediaItem!.id },
        });
        
        console.log('--- MediaItem Record Found in DB after API Upload ---');
        console.log(createdItemFromDb);
        console.log('----------------------------------------------------');
        
        assert.ok(createdItemFromDb, 'Media item should be found in the database');
        assert.strictEqual(createdItemFromDb.fileName, testFileName, 'File name should match');
        assert.strictEqual(createdItemFromDb.uploadedBy, testUser.id, 'UploadedBy should match the user ID');
        
        // Assert: Verify physical file creation
        const fileExists = await fs.stat(createdFilePath).catch(() => false);
        assert.ok(fileExists, `File should exist at path: ${createdFilePath}`);
    });
});
