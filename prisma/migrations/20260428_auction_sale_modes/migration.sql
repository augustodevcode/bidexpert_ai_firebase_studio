-- Add ABA-parity sale mode controls to Auction.
ALTER TABLE `Auction`
  ADD COLUMN `allowSublots` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `perLotEnrollmentEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `preferenceRightEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `allowProposals` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `directSaleEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `proposalDeadline` DATETIME(3) NULL;