import type { 
    Tenant, Role, User, AuctioneerProfileInfo, 
    SellerProfileInfo, Auction, Asset, LotCategory 
} from '../src/types';

export interface ServiceResult<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface TenantResult {
    success: boolean;
    message: string;
    tenant?: Tenant;
}

export interface RoleResult {
    success: boolean;
    message: string;
    role?: Role;
}

export interface UserResult {
    success: boolean;
    message: string;
    user?: User;
}

export interface AuctioneerResult {
    success: boolean;
    message: string;
    auctioneer?: Auctioneer;
}

export interface SellerResult {
    success: boolean;
    message: string;
    seller?: Seller;
}

export interface AuctionResult {
    success: boolean;
    message: string;
    auction?: Auction;
}

export interface AssetResult {
    success: boolean;
    message: string;
    asset?: Asset;
}

export interface CategoryResult {
    success: boolean;
    message: string;
    category?: LotCategory;
}

export interface CreateSeedContext {
    tenant: Tenant;
    roles: Record<string, Role>;
    admin: User;
    auctioneer: Auctioneer;
    seller: Seller;
    auction: Auction;
    categories: LotCategory[];
    assets: Asset[];
}