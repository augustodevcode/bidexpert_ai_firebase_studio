import Link from 'next/link';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to BidExpert AI Firebase Studio</h1>
      <Link href="/report-builder">
        <a>Go to Report Builder</a>
      </Link>
      <br />
      <Link href="/report-designer">
        <a>Go to Report Designer</a>
      </Link>
    </div>
  );
};

export default HomePage;
