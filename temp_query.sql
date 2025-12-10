SELECT 'Auctions' AS entity, COUNT(*) AS count FROM Auction
UNION ALL SELECT 'Lots' AS entity, COUNT(*) AS count FROM Lot
UNION ALL SELECT 'DirectSaleOffers' AS entity, COUNT(*) AS count FROM DirectSaleOffer;
