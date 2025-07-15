using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using BidExpert_Blazor.ApiService.Domain.Entities;
using BidExpert_Blazor.ApiService.Domain.Enums;
using System.Collections.Generic;
using System.Text.Json;

namespace BidExpert_Blazor.ApiService.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<Auction> Auctions { get; set; } = null!;
    public DbSet<Lot> Lots { get; set; } = null!;
    public DbSet<LotCategory> LotCategories { get; set; } = null!;
    public DbSet<Subcategory> Subcategories { get; set; } = null!;
    public DbSet<Seller> Sellers { get; set; } = null!;
    public DbSet<Auctioneer> Auctioneers { get; set; } = null!;
    public DbSet<Bid> Bids { get; set; } = null!;
    public DbSet<MediaItem> MediaItems { get; set; } = null!;
    public DbSet<PlatformSetting> PlatformSettings { get; set; } = null!;
    public DbSet<StateInfo> States { get; set; } = null!;
    public DbSet<CityInfo> Cities { get; set; } = null!;
    public DbSet<DocumentType> DocumentTypes { get; set; } = null!;
    public DbSet<UserDocument> UserDocuments { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;
    public DbSet<LotQuestion> LotQuestions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var jsonSerializerOptions = (JsonSerializerOptions?)null;
        var stringListComparer = new ValueComparer<List<string>>(
            (c1, c2) => c1!.SequenceEqual(c2!),
            c => c!.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c!.ToList());

        // User
        modelBuilder.Entity<User>(entity => {
            entity.ToTable("Users");
            entity.HasKey(e => e.Uid);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.HabilitationStatus).IsRequired().HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Permissions).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>()).Metadata.SetValueComparer(stringListComparer);
            entity.OwnsOne(e => e.Address);
        });

        // Role
        modelBuilder.Entity<Role>(entity => {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NameNormalized).IsRequired();
            entity.HasIndex(e => e.NameNormalized).IsUnique();
            entity.Property(e => e.Permissions).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>()).Metadata.SetValueComparer(stringListComparer);
        });

        // Auction
        modelBuilder.Entity<Auction>(entity => {
            entity.ToTable("Auctions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PublicId).IsUnique();
            entity.Property(e => e.Status).IsRequired().HasConversion<string>();
            entity.Property(e => e.AuctionType).HasConversion<string>();
            entity.Property(e => e.AuctionStages).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<AuctionStage>>(v, jsonSerializerOptions) ?? new List<AuctionStage>());
            entity.Property(e => e.LotIds).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>()).Metadata.SetValueComparer(stringListComparer);
        });

        // Lot
        modelBuilder.Entity<Lot>(entity => {
            entity.ToTable("Lots");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PublicId).IsUnique();
            entity.Property(e => e.Status).IsRequired().HasConversion<string>();
            entity.Property(e => e.GalleryImageUrls).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>()).Metadata.SetValueComparer(stringListComparer);
            entity.Property(e => e.MediaItemIds).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>()).Metadata.SetValueComparer(stringListComparer);
        });

        // PlatformSetting
        modelBuilder.Entity<PlatformSetting>(entity => {
            entity.ToTable("PlatformSettings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Themes).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<ThemeSetting>>(v, jsonSerializerOptions) ?? new List<ThemeSetting>());
            entity.OwnsOne(e => e.PlatformPublicIdMasks);
            entity.OwnsOne(e => e.MentalTriggerSettings);
            entity.OwnsOne(e => e.SectionBadgeVisibility, sb => { sb.OwnsOne(s => s.FeaturedLots); sb.OwnsOne(s => s.SearchGrid); sb.OwnsOne(s => s.SearchList); sb.OwnsOne(s => s.LotDetail); });
            entity.OwnsOne(e => e.MapSettings);
            entity.Property(e => e.HomepageSections).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<HomepageSectionConfigValueObject>>(v, jsonSerializerOptions) ?? new List<HomepageSectionConfigValueObject>());
            entity.Property(e => e.SearchPaginationType).HasConversion<string>();
        });

        // Outras Entidades
        modelBuilder.Entity<MediaItem>().OwnsOne(e => e.Dimensions);
        modelBuilder.Entity<Seller>().OwnsOne(e => e.AddressInfo);
        modelBuilder.Entity<Auctioneer>().OwnsOne(e => e.AddressInfo);
        modelBuilder.Entity<DocumentType>().Property(e => e.AllowedFormats).HasConversion(v => JsonSerializer.Serialize(v, jsonSerializerOptions), v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>()).Metadata.SetValueComparer(stringListComparer);
    }
}
