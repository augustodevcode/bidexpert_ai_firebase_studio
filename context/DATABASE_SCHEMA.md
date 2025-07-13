# Database Schema (MySQL)

This document outlines the structure of the MySQL database tables for the BidExpert project.

## `auctioneers`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| slug | varchar(150) | YES | UNI | NULL | |
| name | varchar(150) | NO | | NULL | |
| registrationNumber | varchar(50) | YES | | NULL | |
| contactName | varchar(150) | YES | | NULL | |
| email | varchar(100) | YES | | NULL | |
| phone | varchar(20) | YES | | NULL | |
| address | varchar(200) | YES | | NULL | |
| city | varchar(100) | YES | | NULL | |
| state | varchar(50) | YES | | NULL | |
| zipCode | varchar(10) | YES | | NULL | |
| website | varchar(255) | YES | | NULL | |
| logoUrl | varchar(255) | YES | | NULL | |
| logoMediaId | varchar(100) | YES | | NULL | |
| dataAiHintLogo | varchar(100) | YES | | NULL | |
| description | text | YES | | NULL | |
| userId | int(11) | YES | MUL | NULL | |
| memberSince | datetime | YES | | NULL | |
| rating | decimal(3,2) | YES | | NULL | |
| auctionsConductedCount | int(11) | YES | | NULL | |
| totalValueSold | decimal(15,2) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |

## `auctions`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| slug | varchar(255) | YES | UNI | NULL | |
| title | varchar(255) | NO | | NULL | |
| description | text | YES | | NULL | |
| status | varchar(50) | YES | | NULL | |
| auctionDate | datetime | YES | | NULL | |
| endDate | datetime | YES | | NULL | |
| totalLots | int(11) | YES | | NULL | |
| categoryId | int(11) | YES | MUL | NULL | |
| auctioneerId | int(11) | YES | MUL | NULL | |
| sellerId | int(11) | YES | MUL | NULL | |
| mapAddress | varchar(255) | YES | | NULL | |
| imageUrl | varchar(255) | YES | | NULL | |
| imageMediaId | varchar(100) | YES | | NULL | |
| dataAiHint | varchar(100) | YES | | NULL | |
| visits | int(11) | YES | | NULL | |
| initialOffer | decimal(15,2) | YES | | NULL | |
| auctionType | varchar(50) | YES | | NULL | |
| auctionStages | json | YES | | NULL | |
| documentsUrl | varchar(255) | YES | | NULL | |
| evaluationReportUrl | varchar(255) | YES | | NULL | |
| auctionCertificateUrl | varchar(255) | YES | | NULL | |
| sellingBranch | varchar(100) | YES | | NULL | |
| automaticBiddingEnabled | tinyint(1) | YES | | NULL | |
| silentBiddingEnabled | tinyint(1) | YES | | NULL | |
| allowMultipleBidsPerUser | tinyint(1) | YES | | NULL | |
| allowInstallmentBids | tinyint(1) | YES | | NULL | |
| softCloseEnabled | tinyint(1) | YES | | NULL | |
| softCloseMinutes | int(11) | YES | | NULL | |
| estimatedRevenue | decimal(15,2) | YES | | NULL | |
| achievedRevenue | decimal(15,2) | YES | | NULL | |
| totalHabilitatedUsers | int(11) | YES | | NULL | |
| isFeaturedOnMarketplace | tinyint(1) | YES | | NULL | |
| marketplaceAnnouncementTitle | varchar(150) | YES | | NULL | |
| judicialProcessId | int(11) | YES | | NULL | |
| additionalTriggers | json | YES | | NULL | |
| decrementAmount | decimal(15,2) | YES | | NULL | |
| decrementIntervalSeconds | int(11) | YES | | NULL | |
| floorPrice | decimal(15,2) | YES | | NULL | |
| auto_relist_settings | json | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `bens`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| title | varchar(200) | NO | | NULL | |
| description | text | YES | | NULL | |
| status | varchar(50) | NO | | DISPONIVEL | |
| categoryId | int(11) | YES | MUL | NULL | |
| subcategoryId | int(11) | YES | MUL | NULL | |
| judicialProcessId | int(11) | YES | MUL | NULL | |
| sellerId | int(11) | YES | MUL | NULL | |
| evaluationValue | decimal(15,2) | YES | | NULL | |
| imageUrl | varchar(255) | YES | | NULL | |
| imageMediaId | varchar(100) | YES | | NULL | |
| galleryImageUrls | json | YES | | NULL | |
| mediaItemIds | json | YES | | NULL | |
| dataAiHint | varchar(100) | YES | | NULL | |
| locationCity | varchar(100) | YES | | NULL | |
| locationState | varchar(100) | YES | | NULL | |
| address | varchar(255) | YES | | NULL | |
| latitude | decimal(10,8) | YES | | NULL | |
| longitude | decimal(11,8) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |
| plate | varchar(10) | YES | | NULL | |
| make | varchar(50) | YES | | NULL | |
| model | varchar(50) | YES | | NULL | |
| version | varchar(100) | YES | | NULL | |
| year | int(11) | YES | | NULL | |
| modelYear | int(11) | YES | | NULL | |
| mileage | int(11) | YES | | NULL | |
| color | varchar(30) | YES | | NULL | |
| fuelType | varchar(30) | YES | | NULL | |
| transmissionType | varchar(30) | YES | | NULL | |
| bodyType | varchar(50) | YES | | NULL | |
| vin | varchar(17) | YES | | NULL | |
| renavam | varchar(11) | YES | | NULL | |
| enginePower | varchar(50) | YES | | NULL | |
| numberOfDoors | int(11) | YES | | NULL | |
| vehicleOptions | varchar(500) | YES | | NULL | |
| detranStatus | varchar(100) | YES | | NULL | |
| debts | varchar(500) | YES | | NULL | |
| runningCondition | varchar(100) | YES | | NULL | |
| bodyCondition | varchar(100) | YES | | NULL | |
| tiresCondition | varchar(100) | YES | | NULL | |
| hasKey | tinyint(1) | YES | | NULL | |
| propertyRegistrationNumber | varchar(50) | YES | | NULL | |
| iptuNumber | varchar(50) | YES | | NULL | |
| isOccupied | tinyint(1) | YES | | NULL | |
| totalArea | decimal(10,2) | YES | | NULL | |
| builtArea | decimal(10,2) | YES | | NULL | |
| bedrooms | int(11) | YES | | NULL | |
| suites | int(11) | YES | | NULL | |
| bathrooms | int(11) | YES | | NULL | |
| parkingSpaces | int(11) | YES | | NULL | |
| constructionType | varchar(100) | YES | | NULL | |
| finishes | varchar(500) | YES | | NULL | |
| infrastructure | varchar(500) | YES | | NULL | |
| condoDetails | varchar(500) | YES | | NULL | |
| improvements | varchar(500) | YES | | NULL | |
| topography | varchar(100) | YES | | NULL | |
| liensAndEncumbrances | varchar(1000) | YES | | NULL | |
| propertyDebts | varchar(500) | YES | | NULL | |
| unregisteredRecords | varchar(500) | YES | | NULL | |
| hasHabiteSe | tinyint(1) | YES | | NULL | |
| zoningRestrictions | varchar(200) | YES | | NULL | |
| amenities | json | YES | | NULL | |

## `bids`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| lotId | int(11) | YES | MUL | NULL | |
| auctionId | int(11) | YES | MUL | NULL | |
| bidderId | int(11) | YES | MUL | NULL | |
| bidderDisplay | varchar(150) | YES | | NULL | |
| amount | decimal(15,2) | YES | | NULL | |
| timestamp | datetime | YES | | NULL | |

## `cities`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(150) | NO | | NULL | |
| slug | varchar(150) | YES | | NULL | |
| stateId | int(11) | YES | MUL | NULL | |
| stateUf | varchar(2) | YES | | NULL | |
| ibgeCode | varchar(10) | YES | | NULL | |
| lotCount | int(11) | YES | | 0 | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `contact_messages`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| name | varchar(255) | NO | | NULL | |
| email | varchar(255) | NO | | NULL | |
| subject | varchar(255) | NO | | NULL | |
| message | text | NO | | NULL | |
| isRead | tinyint(1) | YES | | 0 | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `courts`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(150) | NO | | NULL | |
| slug | varchar(150) | YES | | NULL | |
| stateUf | varchar(2) | YES | MUL | NULL | |
| website | varchar(255) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `direct_sale_offers`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| title | varchar(200) | NO | | NULL | |
| description | text | YES | | NULL | |
| offerType | varchar(50) | YES | | NULL | |
| price | decimal(15,2) | YES | | NULL | |
| minimumOfferPrice | decimal(15,2) | YES | | NULL | |
| status | varchar(50) | YES | | NULL | |
| category | varchar(100) | YES | | NULL | |
| sellerId | int(11) | YES | MUL | NULL | |
| sellerName | varchar(150) | YES | | NULL | |
| locationCity | varchar(100) | YES | | NULL | |
| locationState | varchar(100) | YES | | NULL | |
| imageUrl | varchar(255) | YES | | NULL | |
| imageMediaId | varchar(100) | YES | | NULL | |
| dataAiHint | varchar(100) | YES | | NULL | |
| galleryImageUrls | json | YES | | NULL | |
| mediaItemIds | json | YES | | NULL | |
| itemsIncluded | json | YES | | NULL | |
| views | int(11) | YES | | NULL | |
| expiresAt | datetime | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `document_templates`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(150) | NO | | NULL | |
| type | varchar(50) | NO | | NULL | |
| content | text | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `document_types`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| name | varchar(100) | NO | | NULL | |
| description | varchar(255) | YES | | NULL | |
| isRequired | tinyint(1) | YES | | 1 | |
| appliesTo | varchar(50) | YES | | ALL | |

## `judicial_branches`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(150) | NO | | NULL | |
| slug | varchar(150) | YES | | NULL | |
| districtId | int(11) | YES | MUL | NULL | |
| contactName | varchar(150) | YES | | NULL | |
| phone | varchar(20) | YES | | NULL | |
| email | varchar(100) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `judicial_districts`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(150) | NO | | NULL | |
| slug | varchar(150) | YES | | NULL | |
| courtId | int(11) | YES | MUL | NULL | |
| stateId | int(11) | YES | MUL | NULL | |
| zipCode | varchar(10) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `judicial_parties`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| process_id | int(11) | NO | MUL | NULL | |
| name | varchar(255) | NO | | NULL | |
| documentNumber | varchar(50) | YES | | NULL | |
| partyType | varchar(50) | NO | | NULL | |

## `judicial_processes`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| processNumber | varchar(100) | NO | | NULL | |
| isElectronic | tinyint(1) | YES | | 1 | |
| courtId | int(11) | YES | MUL | NULL | |
| districtId | int(11) | YES | MUL | NULL | |
| branchId | int(11) | YES | MUL | NULL | |
| sellerId | int(11) | YES | MUL | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `lots`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| auctionId | int(11) | NO | MUL | NULL | |
| number | varchar(20) | YES | | NULL | |
| title | varchar(200) | NO | | NULL | |
| description | text | YES | | NULL | |
| price | decimal(15,2) | NO | | NULL | |
| initialPrice | decimal(15,2) | YES | | NULL | |
| secondInitialPrice | decimal(15,2) | YES | | NULL | |
| bidIncrementStep | decimal(15,2) | YES | | NULL | |
| status | varchar(50) | YES | | NULL | |
| bidsCount | int(11) | YES | | NULL | |
| views | int(11) | YES | | NULL | |
| isFeatured | tinyint(1) | YES | | NULL | |
| isExclusive | tinyint(1) | YES | | NULL | |
| discountPercentage | decimal(5,2) | YES | | NULL | |
| additionalTriggers | json | YES | | NULL | |
| imageUrl | varchar(255) | YES | | NULL | |
| imageMediaId | varchar(100) | YES | | NULL | |
| winningBidTermUrl | varchar(255) | YES | | NULL | |
| galleryImageUrls | json | YES | | NULL | |
| mediaItemIds | json | YES | | NULL | |
| categoryId | int(11) | YES | MUL | NULL | |
| subcategoryId | int(11) | YES | MUL | NULL | |
| sellerId | int(11) | YES | MUL | NULL | |
| auctioneerId | int(11) | YES | MUL | NULL | |
| cityId | int(11) | YES | MUL | NULL | |
| stateId | int(11) | YES | MUL | NULL | |
| latitude | decimal(10,8) | YES | | NULL | |
| longitude | decimal(11,8) | YES | | NULL | |
| mapAddress | varchar(255) | YES | | NULL | |
| endDate | datetime | YES | | NULL | |
| condition | varchar(100) | YES | | NULL | |
| dataAiHint | varchar(100) | YES | | NULL | |
| winnerId | int(11) | YES | MUL | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `lot_bens`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| lotId | int(11) | NO | PRI | NULL | |
| bemId | int(11) | NO | PRI | NULL | |

## `lot_categories`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO | | NULL | |
| slug | varchar(100) | YES | UNI | NULL | |
| description | text | YES | | NULL | |
| itemCount | int(11) | YES | | 0 | |
| has_subcategories | tinyint(1) | YES | | 0 | |
| icon_name | varchar(100) | YES | | NULL | |
| data_ai_hint_icon | varchar(100) | YES | | NULL | |
| cover_image_url | varchar(255) | YES | | NULL | |
| cover_image_media_id | varchar(255) | YES | | NULL | |
| data_ai_hint_cover | varchar(100) | YES | | NULL | |
| mega_menu_image_url | varchar(255) | YES | | NULL | |
| mega_menu_image_media_id | varchar(255) | YES | | NULL | |
| data_ai_hint_mega_menu | varchar(100) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `lot_questions`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| lotId | int(11) | NO | MUL | NULL | |
| auctionId | int(11) | YES | MUL | NULL | |
| userId | int(11) | NO | MUL | NULL | |
| userDisplayName | varchar(150) | YES | | NULL | |
| questionText | text | NO | | NULL | |
| isPublic | tinyint(1) | YES | | NULL | |
| answerText | text | YES | | NULL | |
| answeredByUserId | int(11) | YES | | NULL | |
| answeredByUserDisplayName | varchar(150) | YES | | NULL | |
| answeredAt | datetime | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `lot_reviews`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(255) | NO | PRI | NULL | |
| lot_id | varchar(255) | NO | | NULL | |
| auction_id | varchar(255) | NO | | NULL | |
| user_id | varchar(255) | NO | | NULL | |
| user_display_name | varchar(255) | YES | | NULL | |
| rating | int(11) | NO | | NULL | |
| comment | text | YES | | NULL | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | |

## `media_items`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| fileName | varchar(255) | NO | | NULL | |
| storagePath | varchar(255) | NO | | NULL | |
| title | varchar(255) | YES | | NULL | |
| altText | varchar(255) | YES | | NULL | |
| caption | text | YES | | NULL | |
| description | text | YES | | NULL | |
| mimeType | varchar(100) | YES | | NULL | |
| sizeBytes | int(11) | YES | | NULL | |
| urlOriginal | varchar(255) | YES | | NULL | |
| urlThumbnail | varchar(255) | YES | | NULL | |
| urlMedium | varchar(255) | YES | | NULL | |
| urlLarge | varchar(255) | YES | | NULL | |
| linkedLotIds | json | YES | | NULL | |
| dataAiHint | varchar(100) | YES | | NULL | |
| uploadedBy | varchar(100) | YES | MUL | NULL | |
| uploadedAt | datetime | YES | | NULL | |

## `notifications`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| userId | int(11) | NO | MUL | NULL | |
| message | varchar(255) | NO | | NULL | |
| link | varchar(255) | YES | | NULL | |
| isRead | tinyint(1) | YES | | 0 | |
| createdAt | datetime | YES | | NULL | |

## `platform_settings`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| site_title | varchar(255) | YES | | NULL | |
| site_tagline | varchar(255) | YES | | NULL | |
| logo_url | varchar(2048) | YES | | NULL | |
| favicon_url | varchar(2048) | YES | | NULL | |
| gallery_image_base_path | varchar(255) | YES | | NULL | |
| storage_provider | varchar(50) | YES | | NULL | |
| firebase_storage_bucket | varchar(255) | YES | | NULL | |
| active_theme_name | varchar(100) | YES | | NULL | |
| themes | json | YES | | NULL | |
| platform_public_id_masks | json | YES | | NULL | |
| homepage_sections | json | YES | | NULL | |
| mental_trigger_settings | json | YES | | NULL | |
| section_badge_visibility | json | YES | | NULL | |
| map_settings | json | YES | | NULL | |
| search_pagination_type | varchar(50) | YES | | NULL | |
| search_items_per_page | int(11) | YES | | NULL | |
| search_load_more_count | int(11) | YES | | NULL | |
| show_countdown_on_lot_detail | tinyint(1) | YES | | NULL | |
| show_countdown_on_cards | tinyint(1) | YES | | NULL | |
| show_related_lots_on_lot_detail | tinyint(1) | YES | | NULL | |
| related_lots_count | int(11) | YES | | NULL | |
| default_urgency_timer_hours | int(11) | YES | | NULL | |
| variable_increment_table | json | YES | | NULL | |
| bidding_settings | json | YES | | NULL | |
| default_list_items_per_page | int(11) | YES | | NULL | |
| updated_at | datetime | YES | | NULL | |

## `roles`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO | UNI | NULL | |
| name_normalized | varchar(100) | NO | UNI | NULL | |
| description | text | YES | | NULL | |
| permissions | json | YES | | NULL | |
| slug | varchar(150) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `sellers`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| publicId | varchar(100) | YES | UNI | NULL | |
| slug | varchar(150) | YES | UNI | NULL | |
| name | varchar(150) | NO | | NULL | |
| contactName | varchar(150) | YES | | NULL | |
| email | varchar(100) | YES | | NULL | |
| phone | varchar(20) | YES | | NULL | |
| address | varchar(200) | YES | | NULL | |
| city | varchar(100) | YES | | NULL | |
| state | varchar(50) | YES | | NULL | |
| zipCode | varchar(10) | YES | | NULL | |
| website | varchar(255) | YES | | NULL | |
| logoUrl | varchar(255) | YES | | NULL | |
| logoMediaId | varchar(100) | YES | | NULL | |
| dataAiHintLogo | varchar(100) | YES | | NULL | |
| description | text | YES | | NULL | |
| user_id | int(11) | YES | MUL | NULL | |
| memberSince | datetime | YES | | NULL | |
| rating | decimal(3,2) | YES | | NULL | |
| activeLotsCount | int(11) | YES | | NULL | |
| totalSalesValue | decimal(15,2) | YES | | NULL | |
| auctionsFacilitatedCount | int(11) | YES | | NULL | |
| is_judicial | tinyint(1) | YES | | 0 | |
| judicial_branch_id | varchar(255) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `states`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO | | NULL | |
| uf | varchar(2) | NO | UNI | NULL | |
| slug | varchar(100) | YES | UNI | NULL | |
| cityCount | int(11) | YES | | 0 | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `subcategories`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO | | NULL | |
| slug | varchar(100) | YES | | NULL | |
| parent_category_id | varchar(255) | NO | | NULL | |
| description | text | YES | | NULL | |
| itemCount | int(11) | YES | | 0 | |
| display_order | int(11) | YES | | 0 | |
| iconUrl | varchar(255) | YES | | NULL | |
| iconMediaId | varchar(100) | YES | | NULL | |
| dataAiHintIcon | varchar(100) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `users`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| uid | varchar(100) | NO | UNI | NULL | |
| email | varchar(100) | NO | UNI | NULL | |
| password | varchar(255) | YES | | NULL | |
| fullName | varchar(150) | YES | | NULL | |
| cpf | varchar(20) | YES | UNI | NULL | |
| cellPhone | varchar(20) | YES | | NULL | |
| razaoSocial | varchar(150) | YES | | NULL | |
| cnpj | varchar(20) | YES | UNI | NULL | |
| dateOfBirth | date | YES | | NULL | |
| zipCode | varchar(10) | YES | | NULL | |
| street | varchar(200) | YES | | NULL | |
| number | varchar(20) | YES | | NULL | |
| complement | varchar(100) | YES | | NULL | |
| neighborhood | varchar(100) | YES | | NULL | |
| city | varchar(100) | YES | | NULL | |
| state | varchar(50) | YES | | NULL | |
| avatarUrl | varchar(255) | YES | | NULL | |
| dataAiHint | varchar(100) | YES | | NULL | |
| seller_id | varchar(255) | YES | | NULL | |
| habilitationStatus | varchar(50) | YES | | NULL | |
| accountType | varchar(50) | YES | | NULL | |
| badges | json | YES | | NULL | |
| optInMarketing | tinyint(1) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |
| rgNumber | varchar(50) | YES | | NULL | |
| rgIssuer | varchar(50) | YES | | NULL | |
| rgIssueDate | date | YES | | NULL | |
| rgState | varchar(2) | YES | | NULL | |
| homePhone | varchar(20) | YES | | NULL | |
| gender | varchar(50) | YES | | NULL | |
| profession | varchar(100) | YES | | NULL | |
| nationality | varchar(100) | YES | | NULL | |
| maritalStatus | varchar(50) | YES | | NULL | |
| propertyRegime | varchar(50) | YES | | NULL | |
| spouseName | varchar(150) | YES | | NULL | |
| spouseCpf | varchar(20) | YES | | NULL | |
| inscricaoEstadual | varchar(50) | YES | | NULL | |
| website | varchar(255) | YES | | NULL | |
| responsibleName | varchar(150) | YES | | NULL | |
| responsibleCpf | varchar(20) | YES | | NULL | |

## `user_documents`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| userId | int(11) | NO | MUL | NULL | |
| documentTypeId | varchar(100) | NO | MUL | NULL | |
| status | varchar(50) | NO | | NULL | |
| fileUrl | varchar(255) | NO | | NULL | |
| fileName | varchar(255) | YES | | NULL | |
| rejectionReason | text | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |
| updatedAt | datetime | YES | | NULL | |

## `user_lot_max_bids`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| userId | int(11) | NO | MUL | NULL | |
| lotId | int(11) | NO | MUL | NULL | |
| maxAmount | decimal(15,2) | YES | | NULL | |
| isActive | tinyint(1) | YES | | NULL | |
| createdAt | datetime | YES | | NULL | |

## `user_roles`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| user_id | varchar(255) | NO | | NULL | |
| role_id | varchar(255) | NO | | NULL | |

## `user_wins`

| Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | varchar(100) | NO | PRI | NULL | |
| lotId | int(11) | YES | MUL | NULL | |
| userId | int(11) | YES | MUL | NULL | |
| winningBidAmount | decimal(15,2) | YES | | NULL | |
| winDate | datetime | YES | | NULL | |
| paymentStatus | varchar(50) | YES | | NULL | |
| invoiceUrl | varchar(255) | YES | | NULL | |
