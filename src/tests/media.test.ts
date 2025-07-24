// tests/media.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { MediaService } from '../src/services/media.service';
import { prisma } from '../src/lib/prisma';
import type { UserProfileData } from '../src/types';

const mediaService = new MediaService();
const testFileName = 'test-image.jpg';
let testUser: UserProfileData;
let createdMediaItemId: string;

test.describe('Media Library Service E2E Tests', () => {

    test.before(async () => {
        // Media items require an uploader (user)
        testUser = await prisma.user.create({
            data: {
                fullName: 'Media Test User',
                email: 'media.test.user@example.com',
                password: 'password', // Not used for auth, just required by schema
                habilitationStatus: 'HABILITADO',
                accountType: 'PHYSICAL',
            }
        });
    });
    
    test.after(async () => {
        try {
            // Clean up created records
            if (createdMediaItemId) {
                 await prisma.mediaItem.delete({ where: { id: createdMediaItemId } });
            }
            if (testUser) {
                await prisma.user.delete({ where: { id: testUser.id } });
            }
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new media item', async () => {
        // Arrange
        const mediaData = {
            fileName: testFileName,
            title: 'Test Image Title',
            mimeType: 'image/jpeg',
            sizeBytes: 12345,
        };
        const fileUrl = `/test/path/${testFileName}`;

        // Act
        const result = await mediaService.createMediaItem(mediaData, fileUrl, testUser.id);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.item?.id, 'Service should return a media item with an ID');
        createdMediaItemId = result.item!.id; // Save for subsequent tests and cleanup

        // Assert: Verify directly in the database
        const createdItemFromDb = await prisma.mediaItem.findUnique({
            where: { id: createdMediaItemId },
        });

        console.log('--- MediaItem Record Found in DB ---');
        console.log(createdItemFromDb);
        console.log('------------------------------------');
        
        assert.ok(createdItemFromDb, 'Media item should be found in the database');
        assert.strictEqual(createdItemFromDb.title, mediaData.title, 'Media item title should match');
        assert.strictEqual(createdItemFromDb.uploadedBy, testUser.id, 'Media item uploadedBy should match the user ID');
        assert.strictEqual(createdItemFromDb.urlOriginal, fileUrl, 'Media item URL should match');
    });

    test('should update media item metadata', async () => {
        // Arrange
        assert.ok(createdMediaItemId, 'A media item must have been created in the previous test');
        const newMetadata = {
            title: 'Updated Test Title',
            altText: 'An updated alt text for the test image',
        };
        
        // Act
        const result = await mediaService.updateMediaItemMetadata(createdMediaItemId, newMetadata);
        
        // Assert: Check service result
        assert.strictEqual(result.success, true, 'Update should be successful');
        
        // Assert: Verify update in DB
        const updatedItem = await prisma.mediaItem.findUnique({ where: { id: createdMediaItemId } });
        assert.strictEqual(updatedItem?.title, newMetadata.title, 'Title should be updated');
        assert.strictEqual(updatedItem?.altText, newMetadata.altText, 'Alt text should be updated');
    });

    test('should delete a media item', async () => {
        // Arrange
        assert.ok(createdMediaItemId, 'A media item must exist to be deleted');
        
        // Act
        const result = await mediaService.deleteMediaItem(createdMediaItemId);
        
        // Assert: Check service result
        assert.strictEqual(result.success, true, 'Delete should be successful');
        
        // Assert: Verify deletion in DB
        const deletedItem = await prisma.mediaItem.findUnique({ where: { id: createdMediaItemId } });
        assert.strictEqual(deletedItem, null, 'The media item should no longer exist in the database');
        
        // Prevent after() hook from trying to delete it again
        createdMediaItemId = '';
    });
});
