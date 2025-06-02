"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addTunnelAction, updateTunnelAction } from "@/app/actions";
import type { Tunnel } from "@/types/tunnel";
import { PlusCircle, Edit } from "lucide-react";
import { useState } from "react";

const tunnelFormSchema = z.object({
  name: z.string().optional(),
  type: z.enum(["subdomain", "path"]),
  route: z.string().min(1, "Route is required."),
  target: z.string().url("Must be a valid URL (e.g., http://localhost:8080 or https://example.com)."),
});

type TunnelFormValues = z.infer<typeof tunnelFormSchema>;

interface TunnelFormProps {
  tunnel?: Tunnel;
  mainAppDomain: string;
}

export function TunnelForm({ tunnel, mainAppDomain }: TunnelFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<TunnelFormValues>({
    resolver: zodResolver(tunnelFormSchema),
    defaultValues: tunnel
      ? { name: tunnel.name || "", type: tunnel.type, route: tunnel.route, target: tunnel.target }
      : { name: "", type: "path", route: "", target: "" },
  });

  const watchedType = form.watch("type");
  const watchedRoute = form.watch("route");

  async function onSubmit(data: TunnelFormValues) {
    const result = tunnel
      ? await updateTunnelAction(tunnel.id, data)
      : await addTunnelAction(data);

    if (result.success) {
      toast({
        title: tunnel ? "Tunnel Updated" : "Tunnel Added",
        description: `Tunnel configuration for '${data.route}' has been saved.`,
      });
      setIsOpen(false);
      form.reset(tunnel ? data : { name: "", type: "path", route: "", target: "" }); // Reset form after successful submission
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to save tunnel.",
        variant: "destructive",
      });
    }
  }

  const routePlaceholder = watchedType === "subdomain" 
    ? "sub.yourdomain.com" 
    : "/example-path";
  
  const routePrefix = watchedType === "path" ? `${mainAppDomain}` : "";


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {tunnel ? (
          <Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        ) : (
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Tunnel</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{tunnel ? "Edit Tunnel" : "Add New Tunnel"}</DialogTitle>
          <DialogDescription>
            {tunnel ? "Update the details of your existing tunnel." : "Configure a new tunnel. Ensure your DNS is set up for subdomains."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friendly Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tunnel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="path">Path-based</SelectItem>
                      <SelectItem value="subdomain">Subdomain</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="route"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      {routePrefix && <span className="text-muted-foreground mr-1">{routePrefix}</span>}
                      <Input placeholder={routePlaceholder} {...field} />
                    </div>
                  </FormControl>
                  {watchedType === "subdomain" && (
                     <p className="text-sm text-muted-foreground">Enter the full subdomain (e.g., app.yourproxy.com). Requires wildcard DNS (*.yourproxy.com).</p>
                  )}
                  {watchedType === "path" && (
                     <p className="text-sm text-muted-foreground">Enter the path (e.g., /myservice). It will be served on your main domain.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http://localhost:3000 or https://remote-service.com" {...field} />
                  </FormControl>
                   <p className="text-sm text-muted-foreground">The full URL (including http/https) of the service to proxy to.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : (tunnel ? "Save Changes" : "Add Tunnel")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
