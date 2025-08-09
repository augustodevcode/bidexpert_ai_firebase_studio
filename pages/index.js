import Link from 'next/link';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to BidExpert AI Firebase Studio</h1>
      <Link href="/report-builder">
        Go to Report Builder
      </Link>
      <br />
      <Link href="/report-designer">
        Go to Report Designer
      </Link>
    </div>
  );
};

export default HomePage;
