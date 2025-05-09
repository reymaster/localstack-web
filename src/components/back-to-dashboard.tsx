import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackToDashboard() {
  return (
    <div className="flex justify-end -mb-13">
        <Link href="/">
            <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
            </Button>
        </Link>
    </div>
  );
}
