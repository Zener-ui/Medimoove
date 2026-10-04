import { useState } from "react";
import { Wallet } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getPlatformBalance,getPlatformLedger,getPlatformWithdrawals,
  requestPlatformWithdrawal,approvePlatformWithdrawal
} from "@/api/platform";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import BankAccountFields from "@/components/common/BankAccountFields";

export default function PlatformRevenuePage() {
  const qc=useQueryClient();
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({amount:"",bank_account:"",bank_code:"",bank_name:"",account_name:""});
  const [verifiedAccount,setVerifiedAccount]=useState(null);

  const {data:bd,isLoading}=useQuery({queryKey:["platform-balance"],queryFn:getPlatformBalance});
  const {data:ld}=useQuery({queryKey:["platform-ledger"],queryFn:getPlatformLedger});
  const {data:wd}=useQuery({queryKey:["platform-withdrawals"],queryFn:getPlatformWithdrawals});

  const balance=bd?.balance||{};
  const entries=ld?.entries||[];
  const withdrawals=wd?.withdrawals||[];

  const request=useMutation({
    mutationFn:requestPlatformWithdrawal,
    onSuccess:()=>{toast.success("Platform withdrawal requested.");setOpen(false);
      setForm({amount:"",bank_account:"",bank_code:"",bank_name:"",account_name:""});
      setVerifiedAccount(null);
      qc.invalidateQueries({queryKey:["platform-balance"]});
      qc.invalidateQueries({queryKey:["platform-withdrawals"]});
      qc.invalidateQueries({queryKey:["platform-ledger"]});},
    onError:(e)=>toast.error(e.message)
  });

  const approve=useMutation({
    mutationFn:approvePlatformWithdrawal,
    onSuccess:()=>{toast.success("Payout sent to Paystack for processing.");
      qc.invalidateQueries({queryKey:["platform-balance"]});
      qc.invalidateQueries({queryKey:["platform-withdrawals"]});},
    onError:(e)=>toast.error(e.message)
  });

  return <div className="min-h-screen">
    <TopBar title="Platform Revenue"/>
    <div className="px-4 py-3 space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-3"><Wallet className="w-6 h-6 text-teal"/>
          <p className="text-slate-muted text-xs">Available Medimoove Revenue</p></div>
        <p className="text-teal text-3xl font-black mt-2">{isLoading?"—":formatNaira(balance.available_balance||0)}</p>
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          <div><p className="text-slate-muted">Pending</p><p className="text-ink font-bold">{formatNaira(balance.pending_balance||0)}</p></div>
          <div><p className="text-slate-muted">Total earned</p><p className="text-ink font-bold">{formatNaira(balance.total_earned||0)}</p></div>
          <div><p className="text-slate-muted">Refunds recoverable</p><p className="text-yellow-500 font-bold">{formatNaira(balance.recoverable_refunds||0)}</p></div>
        </div>
        <Button className="mt-4" onClick={()=>setOpen(true)} disabled={Number(balance.available_balance||0)<=0}>Withdraw Platform Revenue</Button>
      </Card>

      <Card className="p-4">
        <h3 className="text-ink font-semibold text-sm mb-3">Platform Payouts</h3>
        {withdrawals.length===0?<p className="text-slate-muted text-sm">No platform payouts yet.</p>:
          withdrawals.map(w=><div key={w.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border mb-2">
            <div><p className="text-ink text-xs font-semibold">{formatNaira(w.amount)}</p>
              <p className="text-slate-muted text-[10px]">{w.bank_name} • {w.bank_account}</p>
              <p className="text-slate-muted text-[10px]">{formatDate(w.requested_at)}</p></div>
            <div className="text-right"><p className="text-xs font-semibold">{w.status}</p>
              {w.status==="PENDING"&&<Button size="sm" onClick={()=>approve.mutate(w.id)} loading={approve.isPending}>Approve</Button>}</div>
          </div>)}
      </Card>

      <Card className="p-4">
        <h3 className="text-ink font-semibold text-sm mb-3">Revenue Ledger</h3>
        {entries.length===0?<p className="text-slate-muted text-sm">No platform entries yet.</p>:
          entries.map(e=><div key={e.id} className="flex justify-between py-2 border-b border-surface-border last:border-0">
            <div><p className="text-ink text-xs">{e.description}</p><p className="text-slate-muted text-[10px]">{formatDate(e.created_at)}</p></div>
            <span className={`text-xs font-bold ${Number(e.amount)>=0?"text-teal":"text-red-400"}`}>
              {Number(e.amount)>=0?"+":""}{formatNaira(e.amount)}</span>
          </div>)}
      </Card>
    </div>

    <Modal open={open} onClose={()=>setOpen(false)} title="Withdraw Platform Revenue">
      <div className="space-y-3">
        <p className="text-slate-muted text-xs">Only Medimoove platform revenue can be withdrawn here.</p>
        <Input label="Amount (₦)" type="number" min="1" max={balance.available_balance||0}
          value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
        <BankAccountFields form={form} setForm={setForm} verifiedAccount={verifiedAccount} setVerifiedAccount={setVerifiedAccount}/>
        <Button size="xl" disabled={!verifiedAccount || !form.amount}
          onClick={()=>{
            if(!verifiedAccount){toast.error("Verify the bank account before submitting.");return;}
            request.mutate({...form,amount:Number(form.amount)});
          }} loading={request.isPending}>Submit Platform Withdrawal</Button>
      </div>
    </Modal>
  </div>;
}
