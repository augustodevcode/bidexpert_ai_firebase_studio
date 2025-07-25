import Link from 'next/link';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to BidExpert AI Firebase Studio</h1>
      <Link href="/report-builder">
        <a>Go to Report Builder</a>
      </Link>
    </div>
  );
};

export default HomePage;
