import { getTunnels } from "@/lib/configServer";
import { TunnelTable } from "@/components/TunnelTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Dna, Settings } from "lucide-react";
import Image from 'next/image';

export default async function HomePage() {
  const tunnels = await getTunnels();
  const mainAppDomain = process.env.MAIN_APP_DOMAIN || (process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'panda.nationquest.fr');

  return (
    <div className="flex-grow container mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <div className="flex justify-center items-center mb-4">
          <Image src="https://placehold.co/100x100.png" alt="PANDA Logo" width={80} height={80} className="rounded-full mr-4" data-ai-hint="panda logo" />
          <div>
            <h1 className="font-headline text-5xl font-bold text-primary">PANDA Reverse Proxy</h1>
            <p className="text-xl text-muted-foreground mt-1">
              Effortlessly manage and serve your local and remote tunnels.
            </p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center space-x-3">
            <Dna className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>DNS Configuration</CardTitle>
              <CardDescription>Required for subdomain-based tunnels.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              For subdomain tunnels (e.g., <code className="font-code bg-muted p-1 rounded-sm">myservice.{mainAppDomain}</code>), 
              you need to configure a wildcard DNS record (<code className="font-code bg-muted p-1 rounded-sm">*.{mainAppDomain}</code>) 
              pointing to the server where this PANDA instance is running.
            </p>
            <p className="text-sm mt-2">
              Path-based tunnels (e.g., <code className="font-code bg-muted p-1 rounded-sm">{mainAppDomain}/myservice</code>) do not require special DNS setup beyond the main domain.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-x-3">
           <Settings className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Requests are dynamically routed.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              PANDA listens for incoming HTTP requests. Based on your tunnel configurations, it matches requests by subdomain or path and forwards them to your specified target URLs.
            </p>
            <p className="text-sm mt-2">
              All proxied accesses are logged with a timestamp and the forwarded URL in the server console.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8 bg-destructive/10 border-destructive/30">
        <CardHeader className="flex flex-row items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <div>
            <CardTitle className="text-destructive">Important Note on MAIN_APP_DOMAIN</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive-foreground/90">
            The application uses a <code className="font-code bg-destructive/20 p-1 rounded-sm">MAIN_APP_DOMAIN</code> environment variable to correctly identify requests for the dashboard versus requests to be proxied (especially for path-based routes).
            During development, this defaults to <code className="font-code bg-destructive/20 p-1 rounded-sm">localhost:3000</code>.
            For production, ensure <code className="font-code bg-destructive/20 p-1 rounded-sm">MAIN_APP_DOMAIN</code> is set to your primary domain (e.g., <code className="font-code bg-destructive/20 p-1 rounded-sm">panda.nationquest.fr</code>) in your environment variables.
          </p>
        </CardContent>
      </Card>

      <TunnelTable tunnels={tunnels} mainAppDomain={mainAppDomain} />
      
      <footer className="text-center mt-12 py-6 border-t">
        <p className="text-sm text-muted-foreground">
          PANDA Reverse Proxy &copy; {new Date().getFullYear()}. Running on port {process.env.PORT || 3000}.
        </p>
      </footer>
    </div>
  );
}
