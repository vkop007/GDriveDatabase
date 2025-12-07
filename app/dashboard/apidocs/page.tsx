import { Globe, Database } from "lucide-react";
import { DocsTabs } from "../../../components/docs/DocsTabs";

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 text-neutral-200">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Globe className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            API Documentation
          </h1>
        </div>
        <p className="text-lg text-neutral-400 max-w-2xl">
          Learn how to integrate your GDrive Database into your applications
          using our simple NPM package or REST API.
        </p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-4">
        <Database className="h-5 w-5 text-blue-400 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-400 mb-1">New to Databases?</h4>
          <p className="text-sm text-blue-400/80">
            Our Simple Client makes connecting to your database as easy as using
            a local array. No complex SQL queries needed!
          </p>
        </div>
      </div>

      <DocsTabs />
    </div>
  );
}
