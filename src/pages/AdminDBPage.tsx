import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Table2,
  Search,
  Play,
  Loader2,
  Rows3,
} from "lucide-react";

export default function AdminDBPage() {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM agents LIMIT 10");
  const [activeTab, setActiveTab] = useState<"browse" | "sql">("browse");

  const statsQuery = trpc.admin.stats.useQuery();
  const tablesQuery = trpc.admin.listTables.useQuery();
  const schemaQuery = trpc.admin.tableSchema.useQuery(
    { table: selectedTable },
    { enabled: !!selectedTable }
  );
  const dataQuery = trpc.admin.queryTable.useQuery(
    { table: selectedTable, limit: 50, offset: 0 },
    { enabled: !!selectedTable }
  );
  const rawQuery = trpc.admin.rawQuery.useQuery(
    { sql: sqlQuery },
    { enabled: false }
  );

  const handleRunSql = () => {
    rawQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Database className="w-8 h-8 text-[#D4A853]" />
          <div>
            <h1 className="text-2xl font-bold">Base de Données</h1>
            <p className="text-sm text-gray-400">
              SQLite — {statsQuery.data?.dbPath || "..."}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {statsQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#111118] border-[#2A2A3A]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">
                  Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#D4A853]">
                  {statsQuery.data.totalTables}
                </p>
              </CardContent>
            </Card>
            {Object.entries(statsQuery.data.tables).map(([name, count]) => (
              <Card
                key={name}
                className="bg-[#111118] border-[#2A2A3A] cursor-pointer hover:border-[#D4A853] transition-colors"
                onClick={() => {
                  setSelectedTable(name);
                  setActiveTab("browse");
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 capitalize">
                    {name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <Rows3 className="w-5 h-5 text-[#D4A853]" />
                  <p className="text-2xl font-bold">{count as number}</p>
                  <span className="text-xs text-gray-500">lignes</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "browse" ? "default" : "outline"}
            onClick={() => setActiveTab("browse")}
            className={
              activeTab === "browse"
                ? "bg-[#D4A853] text-black"
                : "border-[#2A2A3A] text-gray-300"
            }
          >
            <Table2 className="w-4 h-4 mr-2" />
            Parcourir
          </Button>
          <Button
            variant={activeTab === "sql" ? "default" : "outline"}
            onClick={() => setActiveTab("sql")}
            className={
              activeTab === "sql"
                ? "bg-[#D4A853] text-black"
                : "border-[#2A2A3A] text-gray-300"
            }
          >
            <Play className="w-4 h-4 mr-2" />
            SQL
          </Button>
        </div>

        {/* Table Selector */}
        <div className="flex items-center gap-4">
          <Select
            value={selectedTable}
            onValueChange={setSelectedTable}
          >
            <SelectTrigger className="w-64 bg-[#111118] border-[#2A2A3A]">
              <SelectValue placeholder="Choisir une table..." />
            </SelectTrigger>
            <SelectContent className="bg-[#111118] border-[#2A2A3A]">
              {tablesQuery.data?.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTable && (
            <Badge
              variant="outline"
              className="border-[#D4A853] text-[#D4A853]"
            >
              {dataQuery.data?.count || 0} lignes
            </Badge>
          )}
        </div>

        {/* Schema */}
        {schemaQuery.data && schemaQuery.data.length > 0 && (
          <Card className="bg-[#111118] border-[#2A2A3A]">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">
                Schéma — {selectedTable}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {schemaQuery.data.map((col) => (
                  <Badge
                    key={col.name}
                    variant="outline"
                    className={`${
                      col.pk
                        ? "border-[#D4A853] text-[#D4A853]"
                        : "border-[#2A2A3A] text-gray-400"
                    }`}
                  >
                    {col.name}
                    <span className="text-xs opacity-50 ml-1">{col.type}</span>
                    {col.pk && <span className="ml-1">🔑</span>}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browse Tab */}
        {activeTab === "browse" && selectedTable && dataQuery.data && (
          <Card className="bg-[#111118] border-[#2A2A3A]">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">
                Données — {selectedTable}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2A3A]">
                      {dataQuery.data.rows.length > 0 &&
                        Object.keys(dataQuery.data.rows[0]).map((key) => (
                          <TableHead
                            key={key}
                            className="text-[#D4A853] font-medium"
                          >
                            {key}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataQuery.data.rows.map((row: Record<string, unknown>, i: number) => (
                      <TableRow
                        key={i}
                        className="border-[#2A2A3A] hover:bg-[#1A1A25]"
                      >
                        {Object.values(row).map((val, j) => (
                          <TableCell
                            key={j}
                            className="text-gray-300 max-w-xs truncate"
                          >
                            {typeof val === "string" && val.length > 100
                              ? val.substring(0, 100) + "..."
                              : String(val)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SQL Tab */}
        {activeTab === "sql" && (
          <Card className="bg-[#111118] border-[#2A2A3A]">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">
                Requête SQL (SELECT uniquement)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="bg-[#0A0A0F] border-[#2A2A3A] font-mono text-sm"
                  placeholder="SELECT * FROM agents..."
                />
                <Button
                  onClick={handleRunSql}
                  disabled={rawQuery.isLoading}
                  className="bg-[#D4A853] text-black hover:bg-[#C49A4F]"
                >
                  {rawQuery.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {rawQuery.data && rawQuery.data.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2A3A]">
                        {Object.keys(rawQuery.data[0]).map((key) => (
                          <TableHead
                            key={key}
                            className="text-[#D4A853] font-medium"
                          >
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawQuery.data.map(
                        (row: Record<string, unknown>, i: number) => (
                          <TableRow
                            key={i}
                            className="border-[#2A2A3A] hover:bg-[#1A1A25]"
                          >
                            {Object.values(row).map((val, j) => (
                              <TableCell
                                key={j}
                                className="text-gray-300 max-w-xs truncate"
                              >
                                {typeof val === "string" && val.length > 100
                                  ? val.substring(0, 100) + "..."
                                  : String(val)}
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {rawQuery.error && (
                <p className="text-red-400 text-sm">
                  Erreur: {rawQuery.error.message}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
