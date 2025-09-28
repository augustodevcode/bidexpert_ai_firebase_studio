# Firestore Data Model

This document outlines the collections and the data structure for the BidExpert project using Firestore.

## Collections

-   `auctions`: Stores all auction events.
-   `lots`: Contains all individual lots, linked to an auction.
-   `bens`: Represents individual assets before they are grouped into lots.
-   `users`: Stores user profile data, including authentication info and roles.
-   `roles`: Defines user roles and their associated permissions.
-   `sellers`: Profiles for consignors/sellers.
-   `auctioneers`: Profiles for auctioneers.
-   `lot_categories`: Main categories for lots (e.g., Vehicles, Real Estate).
-   `subcategories`: Sub-categories nested under main categories.
-   `bids`: A log of all bids placed on lots.
-   `userWins`: Records of lots won by users.
-   `notifications`: User-specific notifications.
-   `contactMessages`: Messages sent through the public contact form.
-   `user_documents`: Uploaded documents for user habilitation.
-   `mediaItems`: The central media library for all uploaded images and files.
-   `settings`: Global platform settings, stored in a single document named `global`.
-   `judicial_processes`: Stores details of judicial processes linked to auctions/bens.
-   `judicial_districts`: (Comarcas)
-   `judicial_branches`: (Varas)
-   `courts`: (Tribunais)
-   `states`: List of Brazilian states.
-   `cities`: List of Brazilian cities, linked to states.

---

## Data Structures (Fields)

All documents will have an `id` (the Firestore Document ID) and often a `createdAt` and `updatedAt` timestamp. Fields will follow **camelCase** naming convention.

### `auctions` document
- `title` (string)
- `description` (string)
- `status` (string: e.g., 'EM_BREVE', 'ABERTO_PARA_LANCES')
- `auctionDate` (timestamp)
- `endDate` (timestamp)
- `auctioneerId` (string, ref to `auctioneers`)
- `sellerId` (string, ref to `sellers`)
- `imageUrl` (string)
- `...and other relevant auction fields`

### `lots` document
- `auctionId` (string, ref to `auctions`)
- `title` (string)
- `description` (string)
- `number` (string)
- `price` (number, current bid price)
- `initialPrice` (number)
- `status` (string: e.g., 'ABERTO_PARA_LANCES', 'VENDIDO')
- `categoryId` (string, ref to `lot_categories`)
- `bemIds` (array of strings, refs to `bens`)
- `...and other lot-specific fields`

### `users` document
- `uid` (string, from Firebase Auth)
- `email` (string)
- `fullName` (string)
- `cpf` (string)
- `roleIds` (array of strings, refs to `roles`)
- `habilitationStatus` (string)
- `...and other profile fields`

This structure ensures data is organized logically and relations are maintained through reference IDs.
