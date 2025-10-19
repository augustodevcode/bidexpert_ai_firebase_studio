// prisma/models/city.prisma
model City {
  id       BigInt    @id @default(autoincrement())
  name     String
  slug     String    @unique
  state    State     @relation(fields: [stateId], references: [id])
  stateId  BigInt
  stateUf  String?
  ibgeCode String?   @unique

  auctions Auction[]
  lots     Lot[]
  assets   Asset[]

  @@unique([name, stateId])
}
