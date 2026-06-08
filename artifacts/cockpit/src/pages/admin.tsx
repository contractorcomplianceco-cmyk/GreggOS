import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { resetData } = useStore();
  const { toast } = useToast();

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data to default seed values? This cannot be undone.")) {
      resetData();
      toast({ title: "Data Reset", description: "Application data has been restored to defaults." });
    }
  };

  const handleExport = () => {
    const storeData = localStorage.getItem('cockpit-storage');
    if (storeData) {
      const blob = new Blob([storeData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cockpit-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: "Data downloaded successfully." });
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Admin / Setup</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage the application's local storage data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div>
                  <h3 className="font-semibold text-sm">Export Data</h3>
                  <p className="text-xs text-muted-foreground mt-1">Download all current application data as a JSON file.</p>
                </div>
                <Button variant="outline" onClick={handleExport}>Download JSON</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
                <div>
                  <h3 className="font-semibold text-sm text-destructive">Reset Database</h3>
                  <p className="text-xs text-muted-foreground mt-1">Clear all current data and reload the sample seed data.</p>
                </div>
                <Button variant="destructive" onClick={handleReset}>Reset Data</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Lists and categories are currently hardcoded in types.ts for this iteration.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 border rounded bg-muted/20">
                  <h4 className="font-semibold mb-2">Priority Levels</h4>
                  <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                    <li>Low</li>
                    <li>Medium</li>
                    <li>High</li>
                    <li>Urgent</li>
                  </ul>
                </div>
                <div className="p-4 border rounded bg-muted/20">
                  <h4 className="font-semibold mb-2">Call Note Statuses</h4>
                  <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                    <li>New</li>
                    <li>In review</li>
                    <li>Summary drafted</li>
                    <li>Gregg review</li>
                    <li>CRM-ready</li>
                    <li>Copied to CRM</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}