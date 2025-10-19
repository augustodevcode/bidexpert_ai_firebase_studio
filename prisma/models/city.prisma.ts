// prisma/models/city.prisma
model City {
  id      Int       @id @default(autoincrement())
  name    String
  slug    String    @unique
  state   State     @relation(fields: [stateId], references: [id])
  stateId Int
  stateUf String?
  ibgeCode String?   @unique

  auctions Auction[]
  lots     Lot[]
  assets   Asset[]

  @@unique([name, stateId])
}
