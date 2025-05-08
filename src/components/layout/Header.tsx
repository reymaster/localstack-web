import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            LocalStack Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/s3" className="hover:text-blue-300">
              S3
            </Link>
            <Link href="/sqs" className="hover:text-blue-300">
              SQS
            </Link>
            <Link href="/sns" className="hover:text-blue-300">
              SNS
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
