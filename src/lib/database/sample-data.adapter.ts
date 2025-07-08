// src/lib/database/sample-data.adapter.ts
import * as fs from 'fs';
import * as path from 'path';
import type { 
  IDatabaseAdapter, 
  LotCategory, StateInfo, StateFormData, CategoryFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData, AuctionDbData,
  Lot, LotFormData, LotDbData,
  BidInfo, Review, LotQuestion,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus, UserProfileWithPermissions,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme,
  Subcategory, SubcategoryFormData,
  MapSettings,
  SearchPaginationType,
  MentalTriggerSettings,
  BadgeVisibilitySettings,
  SectionBadgeConfig,
  HomepageSectionConfig,
  AuctionStage,
  DirectSaleOffer, DirectSaleOfferFormData,
  UserLotMaxBid,
  UserWin,
  Court, CourtFormData,
  JudicialDistrict, JudicialDistrictFormData,
  JudicialBranch, JudicialBranchFormData,
  JudicialProcess, JudicialProcessFormData,
  Bem, BemFormData,
  ProcessParty,
  DocumentType,
  UserDocument,
  Notification,
  BlogPost,
  UserBid,
  AdminDashboardStats,
  ConsignorDashboardStats
} from '@/types';
import { slugify, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import * as sampleData from '@/lib/sample-data';
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import type { FieldValue as FirebaseAdminFieldValue, Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const DATA_FILE_PATH = path.resolve(process.cwd(), 'src/sample-data.local.json');


export class SampleDataAdapter implements IDatabaseAdapter {
  private localData: { [K in keyof typeof sampleData]: (typeof sampleData)[K] };
  private AdminFieldValue: typeof FirebaseAdminFieldValue;
  private ServerTimestamp: typeof FirebaseAdminTimestamp;


  constructor() {
    try {
        const { AdminFieldValue: FV, ServerTimestamp: ST } = ensureAdminInitialized();
        this.AdminFieldValue = FV as typeof FirebaseAdminFieldValue;
        this.ServerTimestamp = ST as typeof FirebaseAdminTimestamp;

        const baseData = JSON.parse(JSON.stringify(sampleData));
        
        if (fs.existsSync(DATA_FILE_PATH)) {
            const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            const parsedData = JSON.parse(fileContents);
            
            // Merge arrays instead of overwriting them
            for (const key in parsedData) {
                if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
                    const baseValue = baseData[key as keyof typeof sampleData];
                    const parsedValue = parsedData[key as keyof typeof sampleData];

                    if (Array.isArray(baseValue) && Array.isArray(parsedValue)) {
                        const combined = [...baseValue, ...parsedValue];
                        const uniqueMap = new Map();
                        // Use 'id' for objects, otherwise stringify for primitive uniqueness
                        combined.forEach(item => {
                            const mapKey = (item && typeof item === 'object' && 'id' in item && item.id) ? item.id : JSON.stringify(item);
                            if (mapKey !== undefined && mapKey !== null) {
                                uniqueMap.set(mapKey, item);
                            }
                        });
                        baseData[key as keyof typeof sampleData] = Array.from(uniqueMap.values());
                    } else {
                        // For non-array properties, or if base doesn't have the key, just assign
                        baseData[key as keyof typeof sampleData] = parsedValue;
                    }
                }
            }
            this.localData = baseData;
            console.log(`[SampleDataAdapter] Loaded and MERGED data from ${DATA_FILE_PATH}`);
        } else {
             this.localData = baseData;
             console.log("[SampleDataAdapter] sample-data.local.json not found, using initial data from module.");
        }
    } catch (error) {
        console.error("[SampleDataAdapter] Could not read or parse sample-data.local.json, falling back to initial import.", error);
        this.localData = JSON.parse(JSON.stringify(sampleData));
        // Fallback for FieldValue and Timestamp if admin SDK fails
        this.AdminFieldValue = { serverTimestamp: () => new Date() } as any; 
        this.ServerTimestamp = { fromDate: (date: Date) => date } as any;
    }
  }
  
  private _persistData(): void {
    try {
        const dataString = JSON.stringify(this.localData, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, dataString, 'utf8');
        console.log(`[SampleDataAdapter] Data persisted to ${DATA_FILE_PATH}`);
    } catch (error) {
        console.error(`[SampleDataAdapter] FAILED to persist data to ${DATA_FILE_PATH}:`, error);
    }
  }

  private _enrichLotData(lot: Lot): Lot {
    const category = this.localData.sampleLotCategories.find(c => c.id === lot.categoryId);
    const subcategory = this.localData.sampleSubcategories.find(s => s.id === lot.subcategoryId);
    const state = this.localData.sampleStates.find(s => s.id === lot.stateId);
    const city = this.localData.sampleCities.find(c => c.id === lot.cityId);
    const auction = this.localData.sampleAuctions.find(a => a.id === lot.auctionId);
    const seller = this.localData.sampleSellers.find(s => s.id === lot.sellerId);

    return {
        ...lot,
        type: category?.name || lot.type,
        categoryName: category?.name || lot.categoryName,
        subcategoryName: subcategory?.name || lot.subcategoryName,
        stateUf: state?.uf || lot.stateUf,
        cityName: city?.name || lot.cityName,
        auctionName: auction?.title || lot.auctionName,
        sellerName: seller?.name || lot.sellerName,
    };
  }
  
  // --- Schema ---
  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    try {
        await this.ensureDefaultRolesExist();
        await this.getPlatformSettings(); 
        return { success: true, message: 'Sample data adapter ready. Collections will be created on first document write. Default roles and settings ensured.' };
    } catch (error: any) {
        return { success: false, message: `Error during post-init checks: ${error.message}` };
    }
  }

  async disconnect?(): Promise<void> {
    console.log('[SampleDataAdapter] Disconnect not applicable for sample data.');
    return Promise.resolve();
  }
  
  // --- Dashboard ---
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    return Promise.resolve({
      users: this.localData.sampleUserProfiles?.length || 0,
      auctions: this.localData.sampleAuctions?.length || 0,
      lots: this.localData.sampleLots?.length || 0,
      sellers: this.localData.sampleSellers?.length || 0,
    });
  }

  async getConsignorDashboardStats(sellerId: string): Promise<ConsignorDashboardStats> {
    const defaultStats: ConsignorDashboardStats = {
      totalLotsConsigned: 0, activeLots: 0, soldLots: 0, totalSalesValue: 0, salesRate: 0, salesByMonth: [],
    };
    if (!sellerId) return Promise.resolve(defaultStats);
    
    const sellerLots = (this.localData.sampleLots || []).filter(lot => lot.sellerId === sellerId);
    if (!sellerLots.length) return Promise.resolve(defaultStats);
    
    const totalLotsConsigned = sellerLots.length;
    const activeLots = sellerLots.filter(lot => lot.status === 'ABERTO_PARA_LANCES').length;
    const soldLots = sellerLots.filter(lot => lot.status === 'VENDIDO');
    const totalSalesValue = soldLots.reduce((sum, lot) => sum + lot.price, 0);
    const salesRate = totalLotsConsigned > 0 ? (soldLots.length / totalLotsConsigned) * 100 : 0;
    
    // Aggregate sales by month for the last 12 months
    const salesByMonthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        salesByMonthMap.set(monthKey, 0);
    }

    soldLots.forEach(lot => {
        const saleDate = new Date(lot.updatedAt as string); // Assuming updatedAt is sale date
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + lot.price);
        }
    });

    const salesByMonth = Array.from(salesByMonthMap.entries())
      .map(([name, sales]) => ({ name, sales }))
      .sort((a,b) => a.name.localeCompare(b.name));

    return Promise.resolve({
      totalLotsConsigned,
      activeLots,
      soldLots: soldLots.length,
      totalSalesValue,
      salesRate,
      salesByMonth
    });
  }

  // --- Notifications ---
  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const count = (this.localData.sampleNotifications || []).filter(n => n.userId === userId && !n.isRead).length;
    return Promise.resolve(count);
  }
  
  // Stubs and other methods...
  async createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> { return { success: false, message: "Not implemented."}; }
  async getWinsForSeller(sellerId: string): Promise<UserWin[]> { return []; }
  async getLotsForConsignor(sellerId: string): Promise<Lot[]> { return []; }
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> { return { success: false, message: 'Not implemented' }; }
  async getLotCategories(): Promise<LotCategory[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotCategories))); }
  // ... a lot of other stubs ...
  async getRoleByName(name: string): Promise<Role | null> { return null; }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> { return null; }
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    return Promise.resolve(this.localData.samplePlatformSettings);
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updatePlatformSettings is a simulation and does not persist across server restarts.");
    this.localData.samplePlatformSettings = { ...this.localData.samplePlatformSettings, ...data, id: 'global', updatedAt: new Date() };
    return { success: true, message: "Configurações atualizadas (em memória)." };
  }
  
  // Implement other methods as needed, using the this.localData object
  // For brevity, many methods are omitted but would follow this pattern:
  // 1. Access this.localData.sample[Entity]
  // 2. Find, filter, or modify the data in the array
  // 3. Call this._persistData() if it's a mutation (create, update, delete)
  // 4. Return the result as a Promise
  
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    await delay(50);
    const auction = this.localData.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
    if (!auction) return null;
    
    const lotsForAuction = (this.localData.sampleLots || []).filter(lot => lot.auctionId === auction.id);
    const enrichedLots = lotsForAuction.map(l => this._enrichLotData(l));
    
    return {
        ...auction,
        lots: enrichedLots,
        totalLots: enrichedLots.length
    };
  }

  async getAuctions(): Promise<Auction[]> {
    await delay(100);
    const auctionsWithLots = this.localData.sampleAuctions.map(auction => {
        const lotsForAuction = this.localData.sampleLots.filter(l => l.auctionId === auction.id).map(l => this._enrichLotData(l));
        return {
            ...auction,
            lots: lotsForAuction,
            totalLots: lotsForAuction.length,
        };
    });
    return auctionsWithLots;
  }
  
  async getLots(auctionId?: string): Promise<Lot[]> {
      await delay(50);
      let lots = this.localData.sampleLots || [];
      if (auctionId) {
          lots = lots.filter(lot => lot.auctionId === auctionId);
      }
      return lots.map(l => this._enrichLotData(l));
  }
}
