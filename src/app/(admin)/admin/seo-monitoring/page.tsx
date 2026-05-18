'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KeywordItem {
  id: string;
  keyword: string;
  searchEngine: string;
  pagePath: string | null;
  group: string | null;
  active: boolean;
  sortOrder: number;
  currentPosition: number | null;
  previousPosition: number | null;
  change: number | null;
  lastChecked: string | null;
}

interface Summary {
  totalKeywords: number;
  top3: number;
  top5: number;
  top10: number;
  notFound: number;
  avgPosition: number | null;
  improved: number;
  declined: number;
  unchanged: number;
}

interface SeedResult {
  created: number;
  skipped: number;
}

const emptyForm = {
  keyword: '',
  searchEngine: 'google',
  group: '',
  pagePath: '',
};

export default function SeoMonitoringPage() {
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterEngine, setFilterEngine] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchKeywords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterEngine) params.set('searchEngine', filterEngine);
      if (filterGroup) params.set('group', filterGroup);
      params.set('pageSize', '200');

      const res = await fetch(`/api/admin/seo-monitoring/keywords?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setKeywords(data.items || []);
    } catch {
      toast.error('Ошибка загрузки ключевых слов');
    } finally {
      setLoading(false);
    }
  }, [filterEngine, filterGroup]);

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterEngine) params.set('searchEngine', filterEngine);

      const res = await fetch(`/api/admin/seo-monitoring/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSummary(data);
    } catch {
      toast.error('Ошибка загрузки сводки');
    } finally {
      setSummaryLoading(false);
    }
  }, [filterEngine]);

  useEffect(() => {
    fetchKeywords();
    fetchSummary();
  }, [fetchKeywords, fetchSummary]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seo-monitoring/keywords/seed', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      const data: SeedResult = await res.json();
      toast.success(
        `Импорт завершён: добавлено ${data.created}, пропущено ${data.skipped}`
      );
      fetchKeywords();
      fetchSummary();
    } catch {
      toast.error('Ошибка импорта');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.keyword.trim()) {
      toast.error('Введите ключевое слово');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo-monitoring/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          keyword: form.keyword.trim(),
          searchEngine: form.searchEngine,
          group: form.group || null,
          pagePath: form.pagePath || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Ключевое слово добавлено');
      setForm(emptyForm);
      setShowForm(false);
      fetchKeywords();
      fetchSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    if (!confirm(`Удалить "${keyword}"?`)) return;
    try {
      const res = await fetch(`/api/admin/seo-monitoring/keywords/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Удалено');
      fetchKeywords();
      fetchSummary();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: KeywordItem) => {
    try {
      const res = await fetch(`/api/admin/seo-monitoring/keywords/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !item.active }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(item.active ? 'Отключено' : 'Включено');
      fetchKeywords();
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/admin/seo-monitoring/collect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast.success(
        `Сбор завершён: проверено ${data.checked}, ошибок ${data.errors}`
      );
      fetchKeywords();
      fetchSummary();
    } catch {
      toast.error('Ошибка сбора позиций');
    } finally {
      setCollecting(false);
    }
  };

  const groups = Array.from(
    new Set(keywords.filter((k) => k.group).map((k) => k.group!))
  ).sort();

  const getPositionBadge = (item: KeywordItem) => {
    if (item.currentPosition === null) {
      return <span className="text-gray-400 text-sm">—</span>;
    }
    if (item.currentPosition === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          Не найдено
        </span>
      );
    }

    let colorClass = 'bg-gray-100 text-gray-700';
    if (item.currentPosition <= 3) colorClass = 'bg-green-100 text-green-700';
    else if (item.currentPosition <= 5) colorClass = 'bg-yellow-100 text-yellow-700';
    else if (item.currentPosition <= 10) colorClass = 'bg-blue-100 text-blue-700';

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
      >
        {item.currentPosition}
      </span>
    );
  };

  const getChangeBadge = (item: KeywordItem) => {
    if (item.change === null || item.currentPosition === null) {
      return <span className="text-gray-400 text-xs">—</span>;
    }
    if (item.change > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
          <TrendingUp className="w-3 h-3" />+{item.change}
        </span>
      );
    }
    if (item.change < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium">
          <TrendingDown className="w-3 h-3" />
          {item.change}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
        <Minus className="w-3 h-3" />0
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO-мониторинг</h1>
          <p className="text-sm text-gray-500 mt-1">
            Отслеживание позиций сайта в поисковой выдаче
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {seeding ? 'Импорт...' : 'Импорт из SEO-конфига'}
          </button>
          <button
            onClick={handleCollect}
            disabled={collecting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${collecting ? 'animate-spin' : ''}`}
            />
            {collecting ? 'Сбор...' : 'Собрать сейчас'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-3">Новое ключевое слово</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ключевое слово
              </label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="забор из профнастила"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Поисковик
              </label>
              <select
                value={form.searchEngine}
                onChange={(e) =>
                  setForm({ ...form, searchEngine: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="google">Google</option>
                <option value="yandex">Яндекс</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Группа
              </label>
              <input
                type="text"
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="home"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
                className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">В TOP-3</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.top3}</p>
            {summary.improved > 0 && (
              <p className="text-xs text-green-600 mt-1">↑ +{summary.improved} выросло</p>
            )}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">В TOP-5</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.top5}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">В TOP-10</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.top10}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Не найдено</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.notFound}</p>
            {summary.declined > 0 && (
              <p className="text-xs text-red-600 mt-1">↓ −{summary.declined} упало</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 bg-white border rounded-lg px-2">
          <Search className="w-4 h-4 text-gray-400" />
          <select
            value={filterEngine}
            onChange={(e) => setFilterEngine(e.target.value)}
            className="py-2 text-sm focus:outline-none bg-transparent"
          >
            <option value="">Все поисковики</option>
            <option value="google">Google</option>
            <option value="yandex">Яндекс</option>
          </select>
        </div>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="py-2 px-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option value="">Все группы</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {summary?.avgPosition && (
          <span className="text-sm text-gray-500">
            Средняя позиция: <strong>{summary.avgPosition}</strong>
          </span>
        )}
        <span className="text-sm text-gray-500">
          Всего слов: <strong>{keywords.length}</strong>
        </span>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Ключевое слово
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Поисковик
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Группа
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  Позиция
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  Изменение
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Проверено
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Нет ключевых слов</p>
                    <p className="text-sm mt-1">
                      Нажмите «Импорт из SEO-конфига» для загрузки
                    </p>
                  </td>
                </tr>
              ) : (
                keywords.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b hover:bg-gray-50 ${
                      !item.active ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {item.keyword}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.searchEngine === 'yandex'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.searchEngine === 'yandex' ? 'Яндекс' : 'Google'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {item.group || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getPositionBadge(item)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getChangeBadge(item)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(item.lastChecked)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title={item.active ? 'Отключить' : 'Включить'}
                        >
                          {item.active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.keyword)}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
