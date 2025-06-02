"use client";

import type { Tunnel } from "@/types/tunnel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteTunnelAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { TunnelForm } from "./TunnelForm";
import { Trash2, Globe, Waypoints, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface TunnelTableProps {
  tunnels: Tunnel[];
  mainAppDomain: string;
}

export function TunnelTable({ tunnels, mainAppDomain }: TunnelTableProps) {
  const { toast } = useToast();

  async function handleDelete(tunnelId: string, tunnelRoute: string) {
    const result = await deleteTunnelAction(tunnelId);
    if (result.success) {
      toast({
        title: "Tunnel Deleted",
        description: `Tunnel configuration for '${tunnelRoute}' has been deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to delete tunnel.",
        variant: "destructive",
      });
    }
  }

  if (tunnels.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>No Tunnels Configured</CardTitle>
          <CardDescription>Get started by adding your first tunnel mapping.</CardDescription>
        </CardHeader>
        <CardContent>
          <TunnelForm mainAppDomain={mainAppDomain} />
        </CardContent>
      </Card>
    )
  }
  
  const getFullRouteUrl = (tunnel: Tunnel) => {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    if (tunnel.type === 'subdomain') {
      return `${protocol}//${tunnel.route}`;
    }
    return `${protocol}//${mainAppDomain}${tunnel.route.startsWith('/') ? '' : '/'}${tunnel.route}`;
  };


  return (
    <Card className="mt-6">
       <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tunnel Mappings</CardTitle>
          <CardDescription>Manage your active reverse proxy tunnels.</CardDescription>
        </div>
        <TunnelForm mainAppDomain={mainAppDomain} />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tunnels.map((tunnel) => (
                <TableRow key={tunnel.id}>
                  <TableCell className="font-medium">{tunnel.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={tunnel.type === "subdomain" ? "default" : "secondary"} className="capitalize">
                      {tunnel.type === "subdomain" ? <Globe className="mr-1 h-3 w-3" /> : <Waypoints className="mr-1 h-3 w-3" />}
                      {tunnel.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a href={getFullRouteUrl(tunnel)} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary flex items-center">
                     {tunnel.route} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="font-code">{tunnel.target}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <TunnelForm tunnel={tunnel} mainAppDomain={mainAppDomain} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the tunnel mapping for 
                            <span className="font-semibold"> {tunnel.route}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(tunnel.id, tunnel.route)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
