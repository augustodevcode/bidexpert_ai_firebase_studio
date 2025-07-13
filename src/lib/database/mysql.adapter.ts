// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, CityFormData, StateFormData } from '@/types';
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

function toSnakeCase(str: string): string {
    const map: { [key: string]: string } = {
        'publicId': 'publicId',
        'auctionId': 'auctionId',
        'categoryId': 'categoryId',
        'auctioneerId': 'auctioneerId',
        'sellerId': 'sellerId',
        'imageMediaId': 'imageMediaId',
        'judicialProcessId': 'judicialProcessId',
        'subcategoryId': 'subcategoryId',
        'cityId': 'cityId',
        'stateId': 'stateId',
        'winnerId': 'winnerId',
        'lotId': 'lotId',
        'bidderId': 'bidderId',
        'documentTypeId': 'documentTypeId',
        'userId': 'user_id',
        'courtId': 'courtId',
        'districtId': 'districtId',
        'branchId': 'branchId',
        'parentCategoryId': 'parentCategoryId',
        'fullName': 'fullName',
        'razaoSocial': 'razaoSocial',
        'nameNormalized': 'name_normalized',
        'stateUf': 'stateUf',
        'contactName': 'contactName',
        'registrationNumber': 'registrationNumber',
        'zipCode': 'zipCode',
        'logoUrl': 'logoUrl',
        'logoMediaId': 'logoMediaId',
        'dataAiHintLogo': 'dataAiHintLogo',
        'memberSince': 'memberSince',
        'auctionsConductedCount': 'auctionsConductedCount',
        'totalValueSold': 'totalValueSold',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt',
        'auctionDate': 'auctionDate',
        'endDate': 'endDate',
        'totalLots': 'totalLots',
        'mapAddress': 'mapAddress',
        'dataAiHint': 'dataAiHint',
        'initialOffer': 'initialOffer',
        'auctionType': 'auctionType',
        'auctionStages': 'auctionStages',
        'documentsUrl': 'documentsUrl',
        'evaluationReportUrl': 'evaluationReportUrl',
        'auctionCertificateUrl': 'auctionCertificateUrl',
        'sellingBranch': 'sellingBranch',
        'automaticBiddingEnabled': 'automaticBiddingEnabled',
        'silentBiddingEnabled': 'silentBiddingEnabled',
        'allowMultipleBidsPerUser': 'allowMultipleBidsPerUser',
        'allowInstallmentBids': 'allowInstallmentBids',
        'softCloseEnabled': 'softCloseEnabled',
        'softCloseMinutes': 'softCloseMinutes',
        'estimatedRevenue': 'estimatedRevenue',
        'achievedRevenue': 'achievedRevenue',
        'totalHabilitatedUsers': 'totalHabilitatedUsers',
        'isFeaturedOnMarketplace': 'isFeaturedOnMarketplace',
        'marketplaceAnnouncementTitle': 'marketplaceAnnouncementTitle',
        'additionalTriggers': 'additionalTriggers',
        'decrementAmount': 'decrementAmount',
        'decrementIntervalSeconds': 'decrementIntervalSeconds',
        'floorPrice': 'floorPrice',
        'evaluationValue': 'evaluationValue',
        'imageUrl': 'imageUrl',
        'galleryImageUrls': 'galleryImageUrls',
        'mediaItemIds': 'mediaItemIds',
        'locationCity': 'locationCity',
        'locationState': 'locationState',
        'modelYear': 'modelYear',
        'fuelType': 'fuelType',
        'transmissionType': 'transmissionType',
        'bodyType': 'bodyType',
        'enginePower': 'enginePower',
        'numberOfDoors': 'numberOfDoors',
        'vehicleOptions': 'vehicleOptions',
        'detranStatus': 'detranStatus',
        'runningCondition': 'runningCondition',
        'bodyCondition': 'bodyCondition',
        'tiresCondition': 'tiresCondition',
        'hasKey': 'hasKey',
        'propertyRegistrationNumber': 'propertyRegistrationNumber',
        'iptuNumber': 'iptuNumber',
        'isOccupied': 'isOccupied',
        'totalArea': 'totalArea',
        'builtArea': 'builtArea',
        'parkingSpaces': 'parkingSpaces',
        'constructionType': 'constructionType',
        'condoDetails': 'condoDetails',
        'liensAndEncumbrances': 'liensAndEncumbrances',
        'propertyDebts': 'propertyDebts',
        'unregisteredRecords': 'unregisteredRecords',
        'hasHabiteSe': 'hasHabiteSe',
        'zoningRestrictions': 'zoningRestrictions',
        'bidderDisplay': 'bidderDisplay',
        'isRead': 'isRead',
        'offerType': 'offerType',
        'minimumOfferPrice': 'minimumOfferPrice',
        'sellerName': 'sellerName',
        'itemsIncluded': 'itemsIncluded',
        'expiresAt': 'expiresAt',
        'isRequired': 'isRequired',
        'appliesTo': 'appliesTo',
        'partyType': 'partyType',
        'documentNumber': 'documentNumber',
        'isElectronic': 'isElectronic',
        'secondInitialPrice': 'secondInitialPrice',
        'bidIncrementStep': 'bidIncrementStep',
        'bidsCount': 'bidsCount',
        'isFeatured': 'isFeatured',
        'isExclusive': 'isExclusive',
        'discountPercentage': 'discountPercentage',
        'winningBidTermUrl': 'winningBidTermUrl',
        'winnerId': 'winnerId',
        'lotCount': 'lotCount',
        'ibgeCode': 'ibgeCode',
        'hasSubcategories': 'hasSubcategories',
        'coverImageUrl': 'coverImageUrl',
        'coverImageMediaId': 'coverImageMediaId',
        'dataAiHintCover': 'dataAiHintCover',
        'megaMenuImageUrl': 'megaMenuImageUrl',
        'megaMenuImageMediaId': 'megaMenuImageMediaId',
        'dataAiHintMegaMenu': 'dataAiHintMegaMenu',
        'iconName': 'icon_name',
        'dataAiHintIcon': 'data_ai_hint_icon',
        'userDisplayName': 'userDisplayName',
        'questionText': 'questionText',
        'isPublic': 'isPublic',
        'answerText': 'answerText',
        'answeredByUserId': 'answeredByUserId',
        'answeredByUserDisplayName': 'answeredByUserDisplayName',
        'answeredAt': 'answeredAt',
        'fileName': 'fileName',
        'storagePath': 'storagePath',
        'altText': 'altText',
        'mimeType': 'mimeType',
        'sizeBytes': 'sizeBytes',
        'urlOriginal': 'urlOriginal',
        'urlThumbnail': 'urlThumbnail',
        'urlMedium': 'urlMedium',
        'urlLarge': 'urlLarge',
        'linkedLotIds': 'linkedLotIds',
        'uploadedBy': 'uploadedBy',
        'uploadedAt': 'uploadedAt',
        'message': 'message',
        'link': 'link',
        'siteTitle': 'site_title',
        'siteTagline': 'site_tagline',
        'galleryImageBasePath': 'gallery_image_base_path',
        'storageProvider': 'storage_provider',
        'firebaseStorageBucket': 'firebase_storage_bucket',
        'activeThemeName': 'active_theme_name',
        'platformPublicIdMasks': 'platform_public_id_masks',
        'homepageSections': 'homepage_sections',
        'mentalTriggerSettings': 'mental_trigger_settings',
        'sectionBadgeVisibility': 'section_badge_visibility',
        'mapSettings': 'map_settings',
        'searchPaginationType': 'search_pagination_type',
        'searchItemsPerPage': 'search_items_per_page',
        'searchLoadMoreCount': 'search_load_more_count',
        'showCountdownOnLotDetail': 'show_countdown_on_lot_detail',
        'showCountdownOnCards': 'show_countdown_on_cards',
        'showRelatedLotsOnLotDetail': 'show_related_lots_on_lot_detail',
        'relatedLotsCount': 'related_lots_count',
        'defaultUrgencyTimerHours': 'default_urgency_timer_hours',
        'variableIncrementTable': 'variable_increment_table',
        'biddingSettings': 'bidding_settings',
        'defaultListItemsPerPage': 'default_list_items_per_page',
        'logo_url': 'logo_url',
        'favicon_url': 'favicon_url',
        'name_normalized': 'name_normalized',
        'is_judicial': 'is_judicial',
        'judicial_branch_id': 'judicial_branch_id',
        'parent_category_id': 'parent_category_id',
        'display_order': 'display_order',
        'iconUrl': 'iconUrl',
        'iconMediaId': 'iconMediaId',
        'cellPhone': 'cellPhone',
        'dateOfBirth': 'dateOfBirth',
        'habilitationStatus': 'habilitationStatus',
        'accountType': 'accountType',
        'optInMarketing': 'optInMarketing',
        'rgNumber': 'rgNumber',
        'rgIssuer': 'rgIssuer',
        'rgIssueDate': 'rgIssueDate',
        'rgState': 'rgState',
        'homePhone': 'homePhone',
        'maritalStatus': 'maritalStatus',
        'propertyRegime': 'propertyRegime',
        'spouseName': 'spouseName',
        'spouseCpf': 'spouseCpf',
        'inscricaoEstadual': 'inscricaoEstadual',
        'responsibleName': 'responsibleName',
        'responsibleCpf': 'responsibleCpf',
        'fileUrl': 'fileUrl',
        'rejectionReason': 'rejectionReason',
        'maxAmount': 'maxAmount',
        'isActive': 'isActive',
        'winningBidAmount': 'winningBidAmount',
        'winDate': 'winDate',
        'paymentStatus': 'paymentStatus',
        'invoiceUrl': 'invoiceUrl'
    };
    
    // Check the explicit map first
    if (map[str]) {
        return map[str];
    }
    
    // If not in map, perform the snake_case conversion
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}


function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
}

function convertKeysToCamelCase<T extends {}>(obj: any): T {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[toCamelCase(key)] = obj[key];
        }
    }
    return newObj as T;
}

function convertObjectToSnakeCase(obj: Record<string, any>): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value instanceof Date) {
              newObj[toSnakeCase(key)] = value.toISOString().slice(0, 19).replace('T', ' ');
            } else if (typeof value === 'boolean') {
              newObj[toSnakeCase(key)] = value ? 1 : 0;
            } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
              newObj[toSnakeCase(key)] = JSON.stringify(value);
            } else {
              newObj[toSnakeCase(key)] = value;
            }
        }
    }
    return newObj;
}


export class MySqlAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl || !dbUrl.startsWith('mysql://')) {
            this.connectionError = "A variável de ambiente DATABASE_URL (para MySQL) não está definida.";
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            return;
        }
        try {
            this.pool = mysql.createPool(dbUrl);
            console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões MySQL: ${error.message}`;
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            this.pool = null;
        }
    }

    private async getConnection() {
        if (this.connectionError) {
            throw new Error(this.connectionError);
        }
        if (!this.pool) {
            throw new Error("Pool de conexões MySQL não está disponível.");
        }
        return this.pool.getConnection();
    }
    
    private async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        if (!this.pool) return [];
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return (rows as any[]).map(row => convertKeysToCamelCase(row));
        } catch (error: any) {
             console.error(`[MySqlAdapter] Erro na query: "${sql}". Erro: ${error.message}`);
             throw error; 
        } finally {
            connection.release();
        }
    }
    
    private async executeQueryForSingle(sql: string, params: any[] = []): Promise<any | null> {
        const rows = await this.executeQuery(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    public async executeMutation(sql: string, params: any[] = []): Promise<{ success: boolean; message: string; insertId?: number }> {
        if (!this.pool) return { success: false, message: 'Sem conexão com o banco de dados.' };
        const connection = await this.getConnection();
        try {
            const [result] = await connection.execute(sql, params);
            const header = result as ResultSetHeader;
            return { success: true, message: 'Operação realizada com sucesso.', insertId: header.insertId };
        } catch (error: any) {
             if (error.code === 'ER_DUP_ENTRY') {
                return { success: true, message: 'Item já existe, ignorado.' };
            }
            console.error(`[MySqlAdapter] Erro na mutação: "${sql}". Erro: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}` };
        } finally {
            connection.release();
        }
    }
    
    private async genericCreate(tableName: string, data: Record<string, any>): Promise<{ success: boolean; message: string; insertId?: number }> {
      const dataToInsert: Record<string, any> = { ...data };
      if (data.name && !data.slug) dataToInsert['slug'] = slugify(data.name);
      if (data.title && !data.slug) dataToInsert['slug'] = slugify(data.title);

      const snakeCaseData = convertObjectToSnakeCase(dataToInsert);

      const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
      const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
      const values = Object.values(snakeCaseData);

      const sql = `INSERT IGNORE INTO \`${tableName}\` (${fields}) VALUES (${placeholders})`;
      const result = await this.executeMutation(sql, values);
      if (result.success) {
        return { success: true, message: "Registro criado com sucesso!", insertId: result.insertId };
      }
      return { success: false, message: result.message };
    }

    private async genericUpdate(tableName: string, id: number | string, data: Record<string, any>): Promise<{ success: boolean; message: string; }> {
        const updates = { ...data, updatedAt: new Date() };
        if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
        if (updates.title && !updates.slug) updates.slug = slugify(updates.title);
        
        // Remove 'id' from updates if it exists to avoid trying to update the primary key
        if ('id' in updates) delete updates.id;
        
        const snakeCaseUpdates = convertObjectToSnakeCase(updates);
        
        const fieldsToUpdate = Object.keys(snakeCaseUpdates).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(snakeCaseUpdates);

        if (values.length === 0) return { success: true, message: "Nenhum campo para atualizar." };

        const sql = `UPDATE \`${tableName}\` SET ${fieldsToUpdate} WHERE id = ?`;
        return this.executeMutation(sql, [...values, id]);
    }
    
    async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> {
        const snakeCaseData = convertObjectToSnakeCase(data);
        const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
        const values = Object.values(snakeCaseData);

        const sql = `INSERT IGNORE INTO \`platform_settings\` (${fields}) VALUES (${placeholders})`;
        return this.executeMutation(sql, values);
    }


    // --- ENTITY IMPLEMENTATIONS ---

    async getLots(auctionId?: number): Promise<Lot[]> {
        let sql = 'SELECT * FROM `lots`';
        const params = [];
        if (auctionId) {
            sql += ' WHERE `auctionId` = ?';
            params.push(auctionId);
        }
        return this.executeQuery(sql, params);
    }
    
    async getLot(id: number): Promise<Lot | null> {
        return this.executeQueryForSingle('SELECT * FROM `lots` WHERE `id` = ?', [id]);
    }
    
    async getLotsByIds(ids: number[]): Promise<Lot[]> {
        if (ids.length === 0) return Promise.resolve([]);
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM \`lots\` WHERE \`id\` IN (${placeholders})`;
        return this.executeQuery(sql, ids);
    }

    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: number; }> {
      const { bens, ...data } = lotData;
      const result = await this.genericCreate('lots', data);
      if (result.success && result.insertId && bens) {
          for (const bem of bens) {
              await this.executeMutation('INSERT INTO `lot_bens` (`lotId`, `bemId`) VALUES (?, ?)', [result.insertId, bem.id]);
          }
      }
      return { ...result, lotId: result.insertId };
    }

    async updateLot(id: number, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
      return this.genericUpdate('lots', id, updates);
    }

    async deleteLot(id: number): Promise<{ success: boolean; message: string; }> {
      return this.executeMutation('DELETE FROM `lots` WHERE id = ?', [id]);
    }
    
    async getBens(filter?: { judicialProcessId?: number; sellerId?: number; }): Promise<Bem[]> {
        let sql = 'SELECT b.*, cat.name as category_name, sub.name as subcategory_name FROM `bens` b LEFT JOIN `lot_categories` cat ON b.categoryId = cat.id LEFT JOIN `subcategories` sub ON b.subcategoryId = sub.id';
        const params = [];
        const whereClauses = [];
        if (filter?.judicialProcessId) {
            whereClauses.push('b.`judicialProcessId` = ?');
            params.push(filter.judicialProcessId);
        }
        if (filter?.sellerId) {
            whereClauses.push('b.`sellerId` = ?');
            params.push(filter.sellerId);
        }
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        return this.executeQuery(sql, params);
    }

    async getBem(id: number): Promise<Bem | null> {
        return this.executeQueryForSingle('SELECT * FROM `bens` WHERE `id` = ?', [id]);
    }
    
    async getBensByIds(ids: number[]): Promise<Bem[]> {
        if (!ids || ids.length === 0) return [];
        const placeholders = ids.map(() => '?').join(',');
        return this.executeQuery(`SELECT * FROM \`bens\` WHERE id IN (${placeholders})`, ids);
    }
    
    async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: number; }> {
      const result = await this.genericCreate('bens', data);
      return {...result, bemId: result.insertId};
    }
    
    async updateBem(id: number, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('bens', id, data);
    }

    async deleteBem(id: number): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `bens` WHERE id = ?', [id]);
    }

    async getAuctions(): Promise<Auction[]> {
        const auctions = await this.executeQuery('SELECT * FROM `auctions` ORDER BY `auctionDate` DESC');
        for (const auction of auctions) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auctions;
    }

    async getAuction(id: number | string): Promise<Auction | null> {
        const auction = await this.executeQueryForSingle('SELECT * FROM `auctions` WHERE `id` = ? OR `publicId` = ?', [id, id]);
        if (auction) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auction;
    }
    
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: number; }> {
      const { lots, ...data } = auctionData;
      const result = await this.genericCreate('auctions', data);
      return { ...result, auctionId: result.insertId };
    }
    
    async deleteAuction(id: number): Promise<{ success: boolean, message: string }> {
      return this.executeMutation('DELETE FROM `auctions` WHERE id = ?', [id]);
    }

    async updateAuction(id: number, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
       return this.genericUpdate('auctions', id, updates);
    }
    
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM `states` ORDER BY `name`'); }
    async getCities(stateId?: number): Promise<CityInfo[]> {
        let sql = 'SELECT * FROM `cities`';
        if (stateId) {
            sql += ' WHERE `stateId` = ? ORDER BY `name`';
            return this.executeQuery(sql, [stateId]);
        }
        return this.executeQuery(sql + ' ORDER BY `name`');
    }
    
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM `lot_categories` ORDER BY `name`'); }
    
    async getSubcategoriesByParent(parentCategoryId?: number): Promise<Subcategory[]> {
        if (parentCategoryId === undefined) {
          return this.executeQuery('SELECT * FROM `subcategories` ORDER BY `display_order`');
        }
        return this.executeQuery('SELECT * FROM `subcategories` WHERE `parentCategoryId` = ? ORDER BY `display_order`', [parentCategoryId]);
    }
    async getSubcategory(id: number): Promise<Subcategory | null> {
        return this.executeQueryForSingle('SELECT * FROM `subcategories` WHERE `id` = ?', [id]);
    }

    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM `sellers` ORDER BY `name`'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM `auctioneers` ORDER BY `name`'); }
    
     async getUsersWithRoles(): Promise<UserProfileData[]> {
        const sql = `
            SELECT 
                u.*, 
                GROUP_CONCAT(r.id) as role_ids,
                GROUP_CONCAT(r.name) as role_names,
                GROUP_CONCAT(r.permissions) as permissions_json
            FROM \`users\` u
            LEFT JOIN \`user_roles\` ur ON u.uid = ur.user_id
            LEFT JOIN \`roles\` r ON ur.role_id = r.id
            GROUP BY u.id
        `;
        const users = await this.executeQuery(sql);
        return users.map(u => {
            const allPerms = u.permissionsJson ? u.permissionsJson.split(',').flatMap((p: string) => {
                try { return JSON.parse(p); } catch { return []; }
            }) : [];
            u.permissions = [...new Set(allPerms)];
            delete u.permissionsJson; // Clean up
            return u;
        });
    }
    
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const sql = `
            SELECT 
                u.*, 
                GROUP_CONCAT(r.id) as role_ids,
                GROUP_CONCAT(r.name) as role_names,
                GROUP_CONCAT(r.permissions) as permissions_json
            FROM \`users\` u
            LEFT JOIN \`user_roles\` ur ON u.uid = ur.user_id
            LEFT JOIN \`roles\` r ON ur.role_id = r.id
            WHERE u.uid = ?
            GROUP BY u.id
        `;
        const user = await this.executeQueryForSingle(sql, [userId]);
        if (user && user.permissionsJson) {
            const allPerms = user.permissionsJson.split(',').flatMap((p: string) => {
                try { return JSON.parse(p); } catch { return []; }
            });
            user.permissions = [...new Set(allPerms)];
            delete user.permissionsJson;
        }
        return user;
    }
    
    async getRoles(): Promise<Role[]> { 
        console.log("[MySqlAdapter.getRoles] Fetching roles from database...");
        const roles = await this.executeQuery('SELECT * FROM `roles` ORDER BY `name`'); 
        const processedRoles = roles.map(r => {
            if (r.permissions && typeof r.permissions === 'string') {
                 try { r.permissions = JSON.parse(r.permissions); } catch(e) { r.permissions = []; }
            } else if (!r.permissions) {
                r.permissions = [];
            }
            return r;
        });
        console.log("[MySqlAdapter.getRoles] Raw roles from DB:", JSON.stringify(processedRoles, null, 2));
        return processedRoles;
    }

    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> {
        const dataToInsert = { ...role, slug: slugify(role.name), nameNormalized: role.name.toUpperCase() };
        const snakeCaseData = convertObjectToSnakeCase(dataToInsert);
        const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
        const values = Object.values(snakeCaseData);

        const sql = `INSERT IGNORE INTO \`roles\` (${fields}) VALUES (${placeholders})`;
        return this.executeMutation(sql, values);
    }
    
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM `media_items` ORDER BY `uploaded_at` DESC'); }
    
    async getPlatformSettings(): Promise<PlatformSettings | null> {
        const settings = await this.executeQueryForSingle('SELECT * FROM `platform_settings` WHERE id = ?', ['global']);
        if (!settings) return null;
        
        const fieldsToParse = ['themes', 'homepageSections', 'mentalTriggerSettings', 'sectionBadgeVisibility', 'mapSettings', 'variableIncrementTable', 'biddingSettings', 'platformPublicIdMasks'];
        for (const field of fieldsToParse) {
            if (settings[field] && typeof settings[field] === 'string') {
                try {
                    settings[field] = JSON.parse(settings[field]);
                } catch(e: any) {
                    console.error(`Error parsing PlatformSettings field "${field}": ${e.message}`);
                    settings[field] = null;
                }
            }
        }
        return settings;
    }

    async getCourts(): Promise<Court[]> { return this.executeQuery('SELECT * FROM `courts` ORDER BY `name`'); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return this.executeQuery('SELECT * FROM `judicial_districts` ORDER BY `name`'); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return this.executeQuery('SELECT * FROM `judicial_branches` ORDER BY `name`'); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return this.executeQuery('SELECT * FROM `judicial_processes` ORDER BY `created_at` DESC'); }

    async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: number; }> {
      const result = await this.genericCreate('courts', data);
      return {...result, courtId: result.insertId};
    }

    async updateCourt(id: number, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('courts', id, data);
    }
    
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: number; }> {
        const result = await this.genericCreate('judicial_districts', data);
        return {...result, districtId: result.insertId};
    }

    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: number; }> {
      const result = await this.genericCreate('judicial_branches', data);
      return {...result, branchId: result.insertId};
    }

    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: number; }> {
        const { parties, ...processData } = data;
        const result = await this.genericCreate('judicial_processes', processData);
        if (result.success && result.insertId && parties && parties.length > 0) {
            for (const party of parties) {
                await this.genericCreate('judicial_parties', { ...party, process_id: result.insertId });
            }
        }
        return {...result, processId: result.insertId};
    }
    
    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: number; }> {
      const result = await this.genericCreate('states', data);
      return {...result, stateId: result.insertId};
    }

    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: number; }> {
        const result = await this.genericCreate('cities', data);
        return {...result, cityId: result.insertId};
    }

    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: number; }> {
      const result = await this.genericCreate('sellers', data);
      return {...result, sellerId: result.insertId};
    }

    async updateSeller(id: number, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
      return this.genericUpdate('sellers', id, data);
    }

    async deleteSeller(id: number): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `sellers` WHERE id = ?', [id]);
    }
    
    async getSeller(id: number | string): Promise<SellerProfileInfo | null> {
        return this.executeQueryForSingle('SELECT * FROM `sellers` WHERE id = ? OR publicId = ?', [id, id]);
    }
    
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: number; }> {
        const result = await this.genericCreate('auctioneers', data);
        return {...result, auctioneerId: result.insertId};
    }

    async updateAuctioneer(id: number, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('auctioneers', id, data);
    }

    async deleteAuctioneer(id: number): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `auctioneers` WHERE id = ?', [id]);
    }
    
    async getAuctioneer(id: number | string): Promise<AuctioneerProfileInfo | null> {
        return this.executeQueryForSingle('SELECT * FROM `auctioneers` WHERE id = ? OR publicId = ?', [id, id]);
    }

    async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean, message: string }> {
        const id = uuidv4();
        const sql = 'INSERT INTO `user_documents` (id, user_id, documentTypeId, file_url, file_name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await this.executeMutation(sql, [id, userId, documentTypeId, fileUrl, fileName, 'PENDING_ANALYSIS', new Date(), new Date()]);
        
        if (result.success) {
            await this.executeMutation('UPDATE `users` SET habilitationStatus = ? WHERE uid = ? AND habilitationStatus = ?', ['PENDING_ANALYSIS', userId, 'PENDING_DOCUMENTS']);
        }
        
        return result;
    }
    
    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            // Delete existing roles for the user
            await connection.execute('DELETE FROM `user_roles` WHERE `user_id` = ?', [userId]);

            // Insert new roles if any are provided
            if (roleIds.length > 0) {
                const values = roleIds.map(roleId => [userId, roleId]);
                await connection.query('INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES ?', [values]);
            }
            
            await connection.commit();
            return { success: true, message: "Perfis do usuário atualizados com sucesso." };

        } catch (error: any) {
            await connection.rollback();
            console.error(`[MySqlAdapter] Erro na transação de updateUserRoles: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}` };
        } finally {
            connection.release();
        }
    }
    
    async createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
        const newId = uuidv4();
        const fullItem: MediaItem = {
            id: newId,
            urlOriginal: url,
            urlThumbnail: url, // For simplicity, thumbnail is same as original in this adapter
            uploadedAt: new Date(),
            uploadedBy: userId,
            ...item,
        } as MediaItem;
        const result = await this.genericCreate('media_items', fullItem);
        if (result.success) {
            return { success: true, message: 'Item de mídia criado.', item: fullItem }
        }
        return { success: false, message: result.message };
    }
    
    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        const snakeData = convertObjectToSnakeCase(data);
        const fields = Object.keys(snakeData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeData).map(() => '?').join(', ');
        const sql = `INSERT IGNORE INTO \`lot_categories\` (${fields}) VALUES (${placeholders})`;
        return this.executeMutation(sql, Object.values(snakeData));
    }

    async createSubcategory(data: Partial<Subcategory>): Promise<{ success: boolean; message: string; subcategoryId?: number }> {
        const snakeData = convertObjectToSnakeCase(data);
        const fields = Object.keys(snakeData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeData).map(() => '?').join(', ');
        const sql = `INSERT IGNORE INTO \`subcategories\` (${fields}) VALUES (${placeholders})`;
        const result = await this.executeMutation(sql, Object.values(snakeData));
        return { ...result, subcategoryId: result.insertId };
    }

    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        // Need to handle the 'id' field carefully for settings, as it's not auto-increment
        const { id, ...updates } = data;
        const snakeCaseUpdates = convertObjectToSnakeCase(updates);
        const fieldsToUpdate = Object.keys(snakeCaseUpdates).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(snakeCaseUpdates);

        if (values.length === 0) return { success: true, message: "Nenhum campo para atualizar." };

        const sql = `UPDATE \`platform_settings\` SET ${fieldsToUpdate} WHERE id = ?`;
        return this.executeMutation(sql, [...values, 'global']);
    }


    async updateCity(id: number, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }> {
      return this.genericUpdate('cities', id, data);
    }

    async deleteCity(id: number): Promise<{ success: boolean; message: string }> {
      return this.executeMutation('DELETE FROM `cities` WHERE id = ?', [id]);
    }
    
    async updateSubcategory(id: number, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('subcategories', id, data);
    }

    async deleteSubcategory(id: number): Promise<{ success: boolean; message: string; }> {
       return this.executeMutation('DELETE FROM `subcategories` WHERE id = ?', [id]);
    }

    async createUser(data: Partial<UserProfileData>): Promise<{ success: boolean; message: string; userId?: string }> {
        const snakeData = convertObjectToSnakeCase(data);
        const fields = Object.keys(snakeData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeData).map(() => '?').join(', ');
        const sql = `INSERT IGNORE INTO \`users\` (${fields}) VALUES (${placeholders})`;
        const result = await this.executeMutation(sql, Object.values(snakeData));
        return { success: result.success, message: result.message, userId: data.uid };
    }

    async _notImplemented(method: string): Promise<any> {
        if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null);
        const message = `[MySqlAdapter] Método ${method} não implementado.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
}
