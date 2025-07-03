// src/lib/database/sample-data.adapter.ts
import * as fs from 'fs';
import * as path from 'path';
import type { 
  IDatabaseAdapter, 
  LotCategory, StateInfo, StateFormData,
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
  ProcessParty
} from '@/types';
import { slugify, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import * as sampleData from '@/lib/sample-data'; // Import all exports from the new sample-data.ts
import type { WizardData } from '@/components/admin/wizard/wizard-context';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const DATA_FILE_PATH = path.resolve(process.cwd(), 'sample-data.local.json');


export class SampleDataAdapter implements IDatabaseAdapter {
  private localData: { [K in keyof typeof sampleData]: (typeof sampleData)[K] };

  constructor() {
    try {
        const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        this.localData = JSON.parse(fileContents);
        console.log("[SampleDataAdapter] Instance created and data loaded from sample-data.local.json.");
    } catch (error) {
        console.error("[SampleDataAdapter] Could not read from sample-data.local.json, falling back to initial import.", error);
        // Fallback to the imported data if the file doesn't exist or is invalid
        this.localData = JSON.parse(JSON.stringify(sampleData));
    }
  }
  
  private _persistData(): void {
    try {
        const dataString = JSON.stringify(this.localData, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, dataString, 'utf8');
        console.log(`[SampleDataAdapter] In-memory data persisted to ${DATA_FILE_PATH}.`);
    } catch (error) {
        console.error(`[SampleDataAdapter] FAILED to persist data to ${DATA_FILE_PATH}:`, error);
    }
  }

  // --- Schema ---
  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.localData.sampleRoles.length });
  }

  async getBens(judicialProcessId?: string): Promise<Bem[]> {
    await delay(20);
    let bens = this.localData.sampleBens;
    if (judicialProcessId) {
      bens = bens.filter((bem: Bem) => bem.judicialProcessId === judicialProcessId);
    }
    const enrichedBens = bens.map(bem => {
        const cat = this.localData.sampleLotCategories.find(c => c.id === bem.categoryId);
        const subcat = this.localData.sampleSubcategories.find(s => s.id === bem.subcategoryId);
        const proc = this.localData.sampleJudicialProcesses.find(p => p.id === bem.judicialProcessId);
        return {
            ...bem,
            categoryName: cat?.name || 'N/A',
            subcategoryName: subcat?.name,
            judicialProcessNumber: proc?.processNumber
        }
    })
    return Promise.resolve(JSON.parse(JSON.stringify(enrichedBens)));
  }
  async getBensByIds(ids: string[]): Promise<Bem[]> {
    const bens = this.localData.sampleBens.filter(b => ids.includes(b.id));
    return Promise.resolve(JSON.parse(JSON.stringify(bens)));
  }
  async getBem(id: string): Promise<Bem | null> {
    const bem = this.localData.sampleBens.find((b: Bem) => b.id === id || b.publicId === id);
    return Promise.resolve(bem ? JSON.parse(JSON.stringify(bem)) : null);
  }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const newBem: Bem = {
      ...data,
      id: `bem-${uuidv4()}`,
      publicId: `BEM-PUB-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleBens.push(newBem);
    this._persistData();
    return { success: true, message: 'Bem criado com sucesso.', bemId: newBem.id };
  }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleBens.findIndex((b: Bem) => b.id === id || b.publicId === id);
    if (index === -1) return { success: false, message: 'Bem não encontrado.' };
    this.localData.sampleBens[index] = { ...this.localData.sampleBens[index], ...data, updatedAt: new Date() };
    this._persistData();
    return { success: true, message: 'Bem atualizado com sucesso.' };
  }
  async updateBensStatus(bemIds: string[], status: Bem['status']): Promise<{ success: boolean, message: string }> {
      bemIds.forEach(id => {
        const bem = this.localData.sampleBens.find(b => b.id === id);
        if (bem) {
            bem.status = status;
        }
      });
      this._persistData();
      return { success: true, message: `Status de ${bemIds.length} bens atualizado para ${status}`};
  }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleBens = this.localData.sampleBens.filter((b: Bem) => b.id !== id);
    this._persistData();
    return { success: true, message: 'Bem excluído com sucesso.' };
  }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
    const publicId = `LOTE-PUB-${uuidv4()}`;
    const newLot: Lot = {
      ...data,
      id: `lote-${uuidv4()}`,
      publicId: publicId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleLots.push(newLot);
    this._persistData();
    return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id, lotPublicId: publicId };
  }
  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean, message: string, createdLots?: Lot[] }> {
    const createdLots: Lot[] = [];
    for (const lotData of lotsToCreate) {
        const publicId = `LOTE-PUB-${uuidv4()}`;
        const newLot: Lot = {
            ...lotData,
            id: `lote-${uuidv4()}`,
            publicId: publicId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.localData.sampleLots.push(newLot);
        createdLots.push(newLot);
    }
    this._persistData();
    return { success: true, message: `${createdLots.length} lotes criados com sucesso.`, createdLots };
  }
  async createAuctionAndLinkLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    const auctionDetails = wizardData.auctionDetails;
    if (!auctionDetails || !auctionDetails.title || !auctionDetails.auctioneer || !auctionDetails.seller) {
      return { success: false, message: 'Detalhes insuficientes para criar o leilão.'};
    }

    const seller = await this.getSellerByName(auctionDetails.seller);
    const auctioneer = await this.getAuctioneerByName(auctionDetails.auctioneer);
    
    // Find category by name, as forms often work with names
    const category = this.localData.sampleLotCategories.find(c => c.name === wizardData.createdLots?.[0]?.categoryId) || 
                     this.localData.sampleLotCategories[0]; // fallback

    const newAuction: Auction = {
      ...auctionDetails,
      id: `auc-${uuidv4()}`,
      publicId: `AUC-PUB-${uuidv4()}`,
      status: 'EM_PREPARACAO',
      auctionType: wizardData.auctionType,
      sellerId: seller?.id,
      auctioneerId: auctioneer?.id,
      categoryId: category?.id,
      category: category?.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      lots: [],
      totalLots: wizardData.createdLots?.length || 0,
    };
    this.localData.sampleAuctions.push(newAuction);

    // Link lots to the new auction
    (wizardData.createdLots || []).forEach(lot => {
      const lotIndex = this.localData.sampleLots.findIndex(l => l.id === lot.id);
      if (lotIndex !== -1) {
        this.localData.sampleLots[lotIndex].auctionId = newAuction.id;
      }
    });

    this._persistData();
    return { success: true, message: 'Leilão criado e lotes vinculados!', auctionId: newAuction.id };
  }

}
