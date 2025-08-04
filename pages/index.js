import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xfujyfjayhukdhplcfwe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdWp5ZmpheWh1a2RocGxjZndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTAxMDIsImV4cCI6MjA2OTg4NjEwMn0.8Ck5f6vBR1lW1GDy0MLbkFbm-3GrtNWgJhmwodLazhc";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ReportStatistics() {
  const [reports, setReports] = useState([]);
  const [filterWorker, setFilterWorker] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [newAbnormal, setNewAbnormal] = useState(false);
  const [newWorker, setNewWorker] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newProcess, setNewProcess] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const workerFromURL = searchParams.get("worker");
    if (workerFromURL) {
      setFilterWorker(workerFromURL);
    } else {
      document.body.innerHTML = "<h2 style='color:red;'>❌ 未授权访问，请通过扫码进入</h2>";
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase.from("reports").select("*").order("date", { ascending: false });
      if (!error) {
        setReports(data);
      }
    };
    fetchReports();
  }, []);

  const filtered = filterWorker
    ? reports.filter((r) => r.worker.includes(filterWorker))
    : reports;

  const totalHours = filtered.reduce((sum, r) => sum + r.duration, 0);

  useEffect(() => {
    const hasAbnormal = filtered.some((r) => r.abnormal);
    if (hasAbnormal) {
      setAlertMessage("⚠️ 存在异常报工记录，请及时检查。");
    } else {
      setAlertMessage("");
    }
  }, [filtered]);

  const generateQRCodeLinks = () => {
    const workers = [...new Set(reports.map((r) => r.worker))];
    const base = "https://www.highlift.cn/report";
    return workers.map((w) => ({ name: w, url: `${base}?worker=${encodeURIComponent(w)}` }));
  };

  const handleAddReport = async () => {
    if (!newWorker || !newTask || !newProcess || !newDuration) return alert("请填写完整报工信息");
    const newReport = {
      worker: newWorker,
      task: newTask,
      process: newProcess,
      duration: parseFloat(newDuration),
      date: new Date().toISOString().split("T")[0],
      abnormal: newAbnormal,
    };
    const { error } = await supabase.from("reports").insert([newReport]);
    if (!error) {
      setReports((prev) => [newReport, ...prev]);
      setNewWorker("");
      setNewTask("");
      setNewProcess("");
      setNewDuration("");
      setNewAbnormal(false);
    } else {
      alert("报工提交失败，请检查网络或联系管理员。");
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map((r) => ({
      工人: r.worker,
      任务: r.task,
      工序: r.process,
      工时: r.duration,
      日期: r.date,
      异常: r.abnormal ? "是" : "否",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "报工记录");
    XLSX.writeFile(workbook, "报工记录.xlsx");
  };

  const handleLogin = () => {
    if (password === "admin123") {
      setAdminMode(true);
    } else {
      alert("密码错误，只有管理员可访问后台功能。");
    }
  };

  return <div>（请在本地开发环境中查看完整 UI，此为部署版本页面）</div>;
}
