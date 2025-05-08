export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LocalStack Dashboard
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/localstack/localstack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              GitHub
            </a>
            <a
              href="https://docs.localstack.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Documentação
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
