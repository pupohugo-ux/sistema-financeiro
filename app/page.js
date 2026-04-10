'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function Card({ title, children, right }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SidebarButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-slate-900">{label}</span> : null}
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-slate-900">{label}</span> : null}
      <select
        {...props}className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
      >
        {children}
      </select>
    </label>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-900">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Table({ columns, rows, renderRow, emptyMessage = 'Nenhum registro encontrado.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className="border-b border-slate-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-900">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map(renderRow)
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-sm text-slate-900">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [pagina, setPagina] = useState('dashboard');
  const [busca, setBusca] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [salvando, setSalvando] = useState(false);

  const [empresas, setEmpresas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [contas, setContas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);

  const [empresaForm, setEmpresaForm] = useState({ nome: '', cnpj: '' });
  const [fornecedorForm, setFornecedorForm] = useState({ nome: '', cnpj: '', categoria: '' });
  const [contaBancariaForm, setContaBancariaForm] = useState({ empresa_id: '', banco: '', agencia: '', conta: '', descricao: '' });
  const [contaForm, setContaForm] = useState({ empresa_id: '', fornecedor_id: '', descricao: '', categoria: '', centro_custo: '', vencimento: '', valor: '' });
  const [pagamentoForm, setPagamentoForm] = useState({ conta_id: '', conta_pagamento_id: '', data: '', forma: 'PIX', valor: '' });

  async function carregarDados() {
    if (!supabase) return;
    setLoading(true);

    const [empresasRes, fornecedoresRes, contasBancariasRes, contasRes, pagamentosRes] = await Promise.all([
      supabase.from('empresas').select('*').order('id', { ascending: true }),
      supabase.from('fornecedores').select('*').order('id', { ascending: true }),
      supabase.from('contas_bancarias').select('*').order('id', { ascending: true }),
      supabase.from('contas_pagar').select('*').order('id', { ascending: true }),
      supabase.from('pagamentos').select('*').order('id', { ascending: true }),
    ]);

    setEmpresas(empresasRes.data || []);
    setFornecedores(fornecedoresRes.data || []);
    setContasBancarias(contasBancariasRes.data || []);
    setContas(contasRes.data || []);
    setPagamentos(pagamentosRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      carregarDados();
    }
  }, [session]);

  const contasFiltradas = useMemo(() => {
    return contas.filter((c) => {
      const fornecedor = fornecedores.find((f) => f.id === c.fornecedor_id)?.nome || '';
      const empresa = empresas.find((e) => e.id === c.empresa_id)?.nome || '';
      const texto = [c.descricao, fornecedor, empresa, c.categoria, c.centro_custo, c.status].join(' ').toLowerCase();
      const matchBusca = texto.includes(busca.toLowerCase());
      const matchEmpresa = empresaFiltro === 'todas' ? true : String(c.empresa_id) === empresaFiltro;
      return matchBusca && matchEmpresa;
    });
  }, [contas, fornecedores, empresas, busca, empresaFiltro]);

  const stats = useMemo(() => {
    const base = empresaFiltro === 'todas' ? contas : contas.filter((c) => String(c.empresa_id) === empresaFiltro);
    return {
      aberto: base.filter((c) => c.status !== 'Paga').reduce((acc, item) => acc + Number(item.valor || 0), 0),
      vencido: base.filter((c) => c.status === 'Vencida').reduce((acc, item) => acc + Number(item.valor || 0), 0),
      pago: base.filter((c) => c.status === 'Paga').reduce((acc, item) => acc + Number(item.valor || 0), 0),
      pendentes: base.filter((c) => c.status === 'Pendente' || c.status === 'A vencer').length,
    };
  }, [contas, empresaFiltro]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Variáveis do Supabase não configuradas.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) setAuthError(error.message);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }

  async function salvarRegistro(tabela, payload, afterSave) {
    if (!supabase) return;
    setSalvando(true);
    const { error } = await supabase.from(tabela).insert(payload);
    setSalvando(false);
    if (error) {
      alert(error.message);
      return;
    }
    if (afterSave) afterSave();
    await carregarDados();
  }

  async function salvarEmpresa(e) {
    e.preventDefault();
    await salvarRegistro('empresas', [{ nome: empresaForm.nome, cnpj: empresaForm.cnpj }], () => {
      setEmpresaForm({ nome: '', cnpj: '' });
    });
  }

  async function salvarFornecedor(e) {
    e.preventDefault();
    await salvarRegistro('fornecedores', [fornecedorForm], () => {
      setFornecedorForm({ nome: '', cnpj: '', categoria: '' });
    });
  }

  async function salvarContaBancaria(e) {
    e.preventDefault();
    await salvarRegistro('contas_bancarias', [{
      empresa_id: Number(contaBancariaForm.empresa_id),
      banco: contaBancariaForm.banco,
      agencia: contaBancariaForm.agencia,
      conta: contaBancariaForm.conta,
      descricao: contaBancariaForm.descricao,
    }], () => {
      setContaBancariaForm({ empresa_id: '', banco: '', agencia: '', conta: '', descricao: '' });
    });
  }

  async function salvarConta(e) {
    e.preventDefault();
    await salvarRegistro('contas_pagar', [{
      empresa_id: Number(contaForm.empresa_id),
      fornecedor_id: Number(contaForm.fornecedor_id),
      descricao: contaForm.descricao,
      categoria: contaForm.categoria,
      centro_custo: contaForm.centro_custo,
      vencimento: contaForm.vencimento,
      valor: Number(contaForm.valor),
      status: 'Pendente',
    }], () => {
      setContaForm({ empresa_id: '', fornecedor_id: '', descricao: '', categoria: '', centro_custo: '', vencimento: '', valor: '' });
    });
  }

  async function salvarPagamento(e) {
    e.preventDefault();
    if (!supabase) return;
    setSalvando(true);

    const contaId = Number(pagamentoForm.conta_id);
    const insertPagamento = await supabase.from('pagamentos').insert([{
      conta_id: contaId,
      conta_pagamento_id: Number(pagamentoForm.conta_pagamento_id),
      data: pagamentoForm.data,
      valor: Number(pagamentoForm.valor),
      forma: pagamentoForm.forma,
    }]);

    if (insertPagamento.error) {
      setSalvando(false);
      alert(insertPagamento.error.message);
      return;
    }

    const updateConta = await supabase.from('contas_pagar').update({ status: 'Paga' }).eq('id', contaId);
    setSalvando(false);

    if (updateConta.error) {
      alert(updateConta.error.message);
      return;
    }

    setPagamentoForm({ conta_id: '', conta_pagamento_id: '', data: '', forma: 'PIX', valor: '' });
    await carregarDados();
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-6 text-slate-800">
          <h1 className="text-2xl font-bold">Configuração pendente</h1>
          <p className="mt-3 text-sm leading-6">
            Configure as variáveis <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> no Vercel.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Contas a Pagar</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Entrar no sistema</h1>
            <p className="mt-2 text-sm text-slate-900">Use o e-mail e a senha criados no Supabase.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="E-mail" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required placeholder="voce@empresa.com" />
            <Input label="Senha" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required placeholder="••••••••" />
            {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
            <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="h-fit space-y-3 rounded-[32px] border border-slate-200 bg-slate-50 p-4 shadow-sm xl:sticky xl:top-6">
          <div className="rounded-3xl bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Sistema</p>
            <h1 className="mt-2 text-xl font-bold text-slate-900">Contas a Pagar</h1>
            <p className="mt-1 text-sm text-slate-900">Multiempresa · Supabase + Vercel</p>
          </div>

          <SidebarButton label="Dashboard" active={pagina === 'dashboard'} onClick={() => setPagina('dashboard')} />
          <SidebarButton label="Empresas / CNPJs" active={pagina === 'empresas'} onClick={() => setPagina('empresas')} />
          <SidebarButton label="Fornecedores" active={pagina === 'fornecedores'} onClick={() => setPagina('fornecedores')} />
          <SidebarButton label="Contas a Pagar" active={pagina === 'contas'} onClick={() => setPagina('contas')} />
          <SidebarButton label="Pagamentos" active={pagina === 'pagamentos'} onClick={() => setPagina('pagamentos')} />

          <button onClick={handleLogout} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-100">
            Sair
          </button>
        </aside>

        <main className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Painel financeiro</h2>
              <p className="mt-1 text-sm text-slate-900">Sistema conectado ao Supabase, pronto para deploy no Vercel.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar contas, empresa, fornecedor..."
                className="min-w-[260px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              />
              <select
                value={empresaFiltro}
                onChange={(e) => setEmpresaFiltro(e.target.value)}
                className="w-[240px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="todas">Todas as empresas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={String(empresa.id)}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pagina === 'dashboard' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Em aberto" value={formatMoney(stats.aberto)} />
                <StatCard label="Vencido" value={formatMoney(stats.vencido)} />
                <StatCard label="Pago" value={formatMoney(stats.pago)} />
                <StatCard label="Pendentes" value={String(stats.pendentes)} />
              </div>

              <Card title="Próximas contas">
                <Table
                  columns={['Empresa', 'Fornecedor', 'Descrição', 'Vencimento', 'Valor', 'Status']}
                  rows={contasFiltradas.slice(0, 10)}
                  renderRow={(conta) => (
                    <tr key={conta.id}>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm">{empresas.find((e) => e.id === conta.empresa_id)?.nome || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm">{fornecedores.find((f) => f.id === conta.fornecedor_id)?.nome || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.descricao}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.vencimento}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm">{formatMoney(conta.valor)}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.status}</td>
                    </tr>
                  )}
                />
              </Card>
            </div>
          ) : null}

          {pagina === 'empresas' ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Card title="Empresas / CNPJs">
                  <Table
                    columns={['Nome', 'CNPJ']}
                    rows={empresas}
                    renderRow={(empresa) => (
                      <tr key={empresa.id}>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{empresa.nome}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{empresa.cnpj}</td>
                      </tr>
                    )}
                  />
                </Card>
              </div>
              <Card title="Nova empresa">
                <form onSubmit={salvarEmpresa} className="space-y-4">
                  <Input label="Nome" value={empresaForm.nome} onChange={(e) => setEmpresaForm((prev) => ({ ...prev, nome: e.target.value }))} required />
                  <Input label="CNPJ" value={empresaForm.cnpj} onChange={(e) => setEmpresaForm((prev) => ({ ...prev, cnpj: e.target.value }))} required />
                  <button disabled={salvando} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    Salvar empresa
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {pagina === 'fornecedores' ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Card title="Fornecedores">
                  <Table
                    columns={['Nome', 'CNPJ', 'Categoria']}
                    rows={fornecedores}
                    renderRow={(fornecedor) => (
                      <tr key={fornecedor.id}>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{fornecedor.nome}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{fornecedor.cnpj}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{fornecedor.categoria}</td>
                      </tr>
                    )}
                  />
                </Card>
              </div>
              <Card title="Novo fornecedor">
                <form onSubmit={salvarFornecedor} className="space-y-4">
                  <Input label="Nome" value={fornecedorForm.nome} onChange={(e) => setFornecedorForm((prev) => ({ ...prev, nome: e.target.value }))} required />
                  <Input label="CNPJ" value={fornecedorForm.cnpj} onChange={(e) => setFornecedorForm((prev) => ({ ...prev, cnpj: e.target.value }))} />
                  <Input label="Categoria" value={fornecedorForm.categoria} onChange={(e) => setFornecedorForm((prev) => ({ ...prev, categoria: e.target.value }))} />
                  <button disabled={salvando} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    Salvar fornecedor
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {pagina === 'contas' ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-4">
                <Card title="Contas a pagar">
                  <Table
                    columns={['Empresa', 'Fornecedor', 'Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status']}
                    rows={contasFiltradas}
                    renderRow={(conta) => (
                      <tr key={conta.id}>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{empresas.find((e) => e.id === conta.empresa_id)?.nome || '-'}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{fornecedores.find((f) => f.id === conta.fornecedor_id)?.nome || '-'}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.descricao}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.categoria}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.vencimento}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{formatMoney(conta.valor)}</td>
                        <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.status}</td>
                      </tr>
                    )}
                  />
                </Card>
              </div>
              <Card title="Nova conta">
                <form onSubmit={salvarConta} className="space-y-4">
                  <Select label="Empresa" value={contaForm.empresa_id} onChange={(e) => setContaForm((prev) => ({ ...prev, empresa_id: e.target.value }))} required>
                    <option value="">Selecione</option>
                    {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}
                  </Select>
                  <Select label="Fornecedor" value={contaForm.fornecedor_id} onChange={(e) => setContaForm((prev) => ({ ...prev, fornecedor_id: e.target.value }))} required>
                    <option value="">Selecione</option>
                    {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
                  </Select>
                  <Input label="Descrição" value={contaForm.descricao} onChange={(e) => setContaForm((prev) => ({ ...prev, descricao: e.target.value }))} required />
                  <Input label="Categoria" value={contaForm.categoria} onChange={(e) => setContaForm((prev) => ({ ...prev, categoria: e.target.value }))} />
                  <Input label="Centro de custo" value={contaForm.centro_custo} onChange={(e) => setContaForm((prev) => ({ ...prev, centro_custo: e.target.value }))} />
                  <Input label="Vencimento" type="date" value={contaForm.vencimento} onChange={(e) => setContaForm((prev) => ({ ...prev, vencimento: e.target.value }))} required />
                  <Input label="Valor" type="number" step="0.01" value={contaForm.valor} onChange={(e) => setContaForm((prev) => ({ ...prev, valor: e.target.value }))} required />
                  <button disabled={salvando} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    Salvar conta
                  </button>
                </form>
              </Card>
            </div>
          ) : null}

          {pagina === 'pagamentos' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <Card title="Pagamentos registrados">
                    <Table
                      columns={['Data', 'Conta', 'Conta pagadora', 'Forma', 'Valor']}
                      rows={pagamentos}
                      renderRow={(pagamento) => {
                        const conta = contas.find((item) => item.id === pagamento.conta_id);
                        const contaPagadora = contasBancarias.find((item) => item.id === pagamento.conta_pagamento_id);
                        const empresa = empresas.find((item) => item.id === contaPagadora?.empresa_id);
                        return (
                          <tr key={pagamento.id}>
                            <td className="border-b border-slate-100 px-3 py-3 text-sm">{pagamento.data}</td>
                            <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta?.descricao || '-'}</td>
                            <td className="border-b border-slate-100 px-3 py-3 text-sm">{empresa?.nome || '-'} · {contaPagadora?.banco || '-'} · {contaPagadora?.conta || '-'}</td>
                            <td className="border-b border-slate-100 px-3 py-3 text-sm">{pagamento.forma}</td>
                            <td className="border-b border-slate-100 px-3 py-3 text-sm">{formatMoney(pagamento.valor)}</td>
                          </tr>
                        );
                      }}
                    />
                  </Card>
                </div>
                <Card title="Novo pagamento">
                  <form onSubmit={salvarPagamento} className="space-y-4">
                    <Select label="Conta a pagar" value={pagamentoForm.conta_id} onChange={(e) => setPagamentoForm((prev) => ({ ...prev, conta_id: e.target.value }))} required>
                      <option value="">Selecione</option>
                      {contas.filter((conta) => conta.status !== 'Paga').map((conta) => (
                        <option key={conta.id} value={conta.id}>{conta.descricao} · {formatMoney(conta.valor)}</option>
                      ))}
                    </Select>
                    <Select label="Conta de pagamento" value={pagamentoForm.conta_pagamento_id} onChange={(e) => setPagamentoForm((prev) => ({ ...prev, conta_pagamento_id: e.target.value }))} required>
                      <option value="">Selecione</option>
                      {contasBancarias.map((conta) => {
                        const empresa = empresas.find((item) => item.id === conta.empresa_id);
                        return <option key={conta.id} value={conta.id}>{empresa?.nome || '-'} · {conta.banco} · {conta.conta}</option>;
                      })}
                    </Select>
                    <Input label="Data do pagamento" type="date" value={pagamentoForm.data} onChange={(e) => setPagamentoForm((prev) => ({ ...prev, data: e.target.value }))} required />
                    <Select label="Forma" value={pagamentoForm.forma} onChange={(e) => setPagamentoForm((prev) => ({ ...prev, forma: e.target.value }))} required>
                      <option value="PIX">PIX</option>
                      <option value="TED">TED</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Transferência">Transferência</option>
                    </Select>
                    <Input label="Valor pago" type="number" step="0.01" value={pagamentoForm.valor} onChange={(e) => setPagamentoForm((prev) => ({ ...prev, valor: e.target.value }))} required />
                    <button disabled={salvando} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      Salvar pagamento
                    </button>
                  </form>
                </Card>
              </div>

              <Card title="Contas bancárias">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <Table
                      columns={['Empresa', 'Banco', 'Agência', 'Conta', 'Descrição']}
                      rows={contasBancarias}
                      renderRow={(conta) => (
                        <tr key={conta.id}>
                          <td className="border-b border-slate-100 px-3 py-3 text-sm">{empresas.find((e) => e.id === conta.empresa_id)?.nome || '-'}</td>
                          <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.banco}</td>
                          <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.agencia}</td>
                          <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.conta}</td>
                          <td className="border-b border-slate-100 px-3 py-3 text-sm">{conta.descricao}</td>
                        </tr>
                      )}
                    />
                  </div>
                  <form onSubmit={salvarContaBancaria} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900">Nova conta bancária</h3>
                    <Select label="Empresa" value={contaBancariaForm.empresa_id} onChange={(e) => setContaBancariaForm((prev) => ({ ...prev, empresa_id: e.target.value }))} required>
                      <option value="">Selecione</option>
                      {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}
                    </Select>
                    <Input label="Banco" value={contaBancariaForm.banco} onChange={(e) => setContaBancariaForm((prev) => ({ ...prev, banco: e.target.value }))} required />
                    <Input label="Agência" value={contaBancariaForm.agencia} onChange={(e) => setContaBancariaForm((prev) => ({ ...prev, agencia: e.target.value }))} />
                    <Input label="Conta" value={contaBancariaForm.conta} onChange={(e) => setContaBancariaForm((prev) => ({ ...prev, conta: e.target.value }))} required />
                    <Input label="Descrição" value={contaBancariaForm.descricao} onChange={(e) => setContaBancariaForm((prev) => ({ ...prev, descricao: e.target.value }))} />
                    <button disabled={salvando} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      Salvar conta bancária
                    </button>
                  </form>
                </div>
              </Card>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
