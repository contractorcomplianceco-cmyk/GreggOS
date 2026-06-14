import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter } from "wouter";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SidebarLayout } from "@/components/layout/SidebarLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mounting a page in its loading state can skip a reusable component the page
// happens not to render yet, so a crash inside a shared building block (the
// sidebar, a dialog, the most-used UI primitives) could ship unnoticed. These
// tests mount those shared components directly so a bad edit there fails fast,
// using the same vitest + jsdom harness (Clerk + React Query stubbed in
// src/test/setup.ts).

function makeWrapper(location: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <WouterRouter base="" ssrPath={location}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
      </WouterRouter>
    );
  };
}

function mount(ui: ReactNode, location = "/") {
  const Wrapper = makeWrapper(location);
  return render(<Wrapper>{ui}</Wrapper>);
}

describe("shared layout renders without crashing", () => {
  it("SidebarLayout mounts with children", () => {
    const { container } = mount(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>,
    );
    expect(container).toBeTruthy();
  });
});

describe("most-used UI primitives render without crashing", () => {
  it("Card and its sub-parts mount", () => {
    const { container } = mount(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(container).toBeTruthy();
  });

  it("Badge mounts", () => {
    const { container } = mount(<Badge>New</Badge>);
    expect(container).toBeTruthy();
  });

  it("Button mounts", () => {
    const { container } = mount(<Button>Click</Button>);
    expect(container).toBeTruthy();
  });

  it("Input mounts", () => {
    const { container } = mount(<Input placeholder="Search" />);
    expect(container).toBeTruthy();
  });

  it("Textarea mounts", () => {
    const { container } = mount(<Textarea placeholder="Notes" />);
    expect(container).toBeTruthy();
  });

  it("Label mounts", () => {
    const { container } = mount(<Label htmlFor="x">Label</Label>);
    expect(container).toBeTruthy();
  });

  it("Checkbox mounts", () => {
    const { container } = mount(<Checkbox />);
    expect(container).toBeTruthy();
  });

  it("Select trigger mounts", () => {
    const { container } = mount(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(container).toBeTruthy();
  });

  it("Table mounts", () => {
    const { container } = mount(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(container).toBeTruthy();
  });

  it("Tabs mounts", () => {
    const { container } = mount(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent value="two">Second</TabsContent>
      </Tabs>,
    );
    expect(container).toBeTruthy();
  });
});

describe("dialog renders its open content without crashing", () => {
  it("Dialog mounts open with content", () => {
    const { baseElement } = mount(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <div>Body</div>
        </DialogContent>
      </Dialog>,
    );
    // Radix portals dialog content to the body, so assert on baseElement.
    expect(baseElement.textContent ?? "").toContain("Title");
  });
});
