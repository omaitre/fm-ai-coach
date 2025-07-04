import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getAttributeColor } from '@/lib/utils';

interface Player {
  id: number;
  name: string;
  age?: number;
  positions?: string[];
  latestSnapshot?: {
    id: number;
    currentAbility?: number;
    potentialAbility?: number;
    snapshotDate: string;
  };
  attributes?: Array<{
    attributeName: string;
    attributeValue: number;
    attributeCategory: string;
  }>;
}

interface PlayerTableProps {
  players: Player[];
  selectedPositionId?: number;
}

interface ExpandedColumns {
  technical: boolean;
  mental: boolean;
  physical: boolean;
  goalkeeper: boolean;
}

interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

// Ability circle component
const AbilityCircle: React.FC<{ value: number | undefined; label: string }> = ({ value }) => {
  const percentage = value ? Math.min((value / 200) * 100, 100) : 0;
  const radius = 24;
  const strokeWidth = 3;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${percentage / 100 * circumference} ${circumference}`;

  const getColor = () => {
    if (!value) return '#e5e7eb';
    if (value >= 150) return '#22c55e'; // green
    if (value >= 100) return '#eab308'; // yellow
    if (value >= 50) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {value || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PlayerTable: React.FC<PlayerTableProps> = ({ players, selectedPositionId }) => {
  const [expandedColumns, setExpandedColumns] = useState<ExpandedColumns>({
    technical: false,
    mental: false,
    physical: false,
    goalkeeper: false,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: null,
  });

  const toggleColumn = (column: keyof ExpandedColumns) => {
    setExpandedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
  };

  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="w-3 h-3" />;
    if (sortConfig.direction === 'desc') return <ArrowDown className="w-3 h-3" />;
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  };

  const getAttributesByCategory = (player: Player, category: string) => {
    return player.attributes?.filter(attr => 
      attr.attributeCategory.toLowerCase() === category.toLowerCase()
    ) || [];
  };

  const calculateCategoryAverage = (player: Player, category: string) => {
    const categoryAttributes = getAttributesByCategory(player, category);
    if (categoryAttributes.length === 0) return 0;
    
    const sum = categoryAttributes.reduce((acc, attr) => acc + attr.attributeValue, 0);
    return Math.round(sum / categoryAttributes.length);
  };

  const formatPositions = (positions: string[] | undefined) => {
    if (!positions || positions.length === 0) return '-';
    return positions.slice(0, 3).join(', ') + (positions.length > 3 ? '...' : '');
  };

  // Get all unique attributes for each category from the first player (as template)
  const getAttributeTemplate = (category: string) => {
    const firstPlayerWithAttrs = players.find(p => p.attributes && p.attributes.length > 0);
    if (!firstPlayerWithAttrs) return [];
    return getAttributesByCategory(firstPlayerWithAttrs, category);
  };

  // Sorting logic
  const sortedPlayers = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return players;

    return [...players].sort((a, b) => {
      let aValue: any = null;
      let bValue: any = null;

      // Handle basic columns
      switch (sortConfig.column) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case 'ca':
          aValue = a.latestSnapshot?.currentAbility || 0;
          bValue = b.latestSnapshot?.currentAbility || 0;
          break;
        case 'pa':
          aValue = a.latestSnapshot?.potentialAbility || 0;
          bValue = b.latestSnapshot?.potentialAbility || 0;
          break;
        case 'technical-avg':
          aValue = calculateCategoryAverage(a, 'technical');
          bValue = calculateCategoryAverage(b, 'technical');
          break;
        case 'goalkeeper-avg':
          aValue = calculateCategoryAverage(a, 'goalkeeper');
          bValue = calculateCategoryAverage(b, 'goalkeeper');
          break;
        case 'mental-avg':
          aValue = calculateCategoryAverage(a, 'mental');
          bValue = calculateCategoryAverage(b, 'mental');
          break;
        case 'physical-avg':
          aValue = calculateCategoryAverage(a, 'physical');
          bValue = calculateCategoryAverage(b, 'physical');
          break;
        default:
          // Handle individual attributes
          const aAttr = a.attributes?.find(attr => attr.attributeName === sortConfig.column);
          const bAttr = b.attributes?.find(attr => attr.attributeName === sortConfig.column);
          aValue = aAttr?.attributeValue || 0;
          bValue = bAttr?.attributeValue || 0;
      }

      // Sort logic
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, sortConfig, calculateCategoryAverage]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {/* Fixed columns - Primary level */}
              <th 
                className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 min-w-32 max-w-48 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center justify-center gap-1">
                  Age
                  {getSortIcon('age')}
                </div>
              </th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Position
              </th>
              <th 
                className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleSort('ca')}
              >
                <div className="flex items-center justify-center gap-1">
                  CA
                  {getSortIcon('ca')}
                </div>
              </th>
              <th 
                className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleSort('pa')}
              >
                <div className="flex items-center justify-center gap-1">
                  PA
                  {getSortIcon('pa')}
                </div>
              </th>

              {/* Expandable attribute columns - Primary level */}
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-l-2 border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => toggleColumn('technical')}
                    className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {expandedColumns.technical ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Technical
                  </button>
                  <button
                    onClick={() => handleSort('technical-avg')}
                    className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                  >
                    {getSortIcon('technical-avg')}
                  </button>
                </div>
              </th>

              {expandedColumns.technical && getAttributeTemplate('technical').map(attr => (
                <th 
                  key={attr.attributeName} 
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 min-w-20 max-w-24 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" 
                  title={attr.attributeName}
                  onClick={() => handleSort(attr.attributeName)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{attr.attributeName}</span>
                    {getSortIcon(attr.attributeName)}
                  </div>
                </th>
              ))}

              <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-l-2 border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => toggleColumn('goalkeeper')}
                    className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {expandedColumns.goalkeeper ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    GK
                  </button>
                  <button
                    onClick={() => handleSort('goalkeeper-avg')}
                    className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                  >
                    {getSortIcon('goalkeeper-avg')}
                  </button>
                </div>
              </th>

              {expandedColumns.goalkeeper && getAttributeTemplate('goalkeeper').map(attr => (
                <th 
                  key={attr.attributeName} 
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 min-w-20 max-w-24 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" 
                  title={attr.attributeName}
                  onClick={() => handleSort(attr.attributeName)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{attr.attributeName}</span>
                    {getSortIcon(attr.attributeName)}
                  </div>
                </th>
              ))}

              <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-l-2 border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => toggleColumn('mental')}
                    className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {expandedColumns.mental ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Mental
                  </button>
                  <button
                    onClick={() => handleSort('mental-avg')}
                    className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                  >
                    {getSortIcon('mental-avg')}
                  </button>
                </div>
              </th>

              {expandedColumns.mental && getAttributeTemplate('mental').map(attr => (
                <th 
                  key={attr.attributeName} 
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 min-w-20 max-w-24 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" 
                  title={attr.attributeName}
                  onClick={() => handleSort(attr.attributeName)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{attr.attributeName}</span>
                    {getSortIcon(attr.attributeName)}
                  </div>
                </th>
              ))}

              <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-l-2 border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => toggleColumn('physical')}
                    className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {expandedColumns.physical ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Physical
                  </button>
                  <button
                    onClick={() => handleSort('physical-avg')}
                    className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                  >
                    {getSortIcon('physical-avg')}
                  </button>
                </div>
              </th>

              {expandedColumns.physical && getAttributeTemplate('physical').map(attr => (
                <th 
                  key={attr.attributeName} 
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 min-w-20 max-w-24 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" 
                  title={attr.attributeName}
                  onClick={() => handleSort(attr.attributeName)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{attr.attributeName}</span>
                    {getSortIcon(attr.attributeName)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedPlayers.map((player, index) => (
              <tr key={player.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50'
              }`}>
                {/* Fixed columns */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-inherit z-10 min-w-32 max-w-48 whitespace-nowrap overflow-hidden text-ellipsis">
                  {player.name}
                </td>
                <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {player.age || '-'}
                </td>
                <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {formatPositions(player.positions)}
                </td>
                <td className="px-3 py-3 text-center">
                  <AbilityCircle 
                    value={player.latestSnapshot?.currentAbility} 
                    label="CA" 
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <AbilityCircle 
                    value={player.latestSnapshot?.potentialAbility} 
                    label="PA" 
                  />
                </td>

                {/* Technical column */}
                <td className="px-3 py-3 text-center">
                  <div className={`text-sm font-bold ${getAttributeColor(calculateCategoryAverage(player, 'technical'))} ${
                    expandedColumns.technical ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1' : ''
                  }`}>
                    {calculateCategoryAverage(player, 'technical')}
                  </div>
                </td>

                {expandedColumns.technical && getAttributeTemplate('technical').map(attrTemplate => {
                  const playerAttr = getAttributesByCategory(player, 'technical').find(a => a.attributeName === attrTemplate.attributeName);
                  return (
                    <td key={attrTemplate.attributeName} className="px-2 py-3 text-center">
                      {playerAttr ? (
                        <div className={`text-sm font-medium ${getAttributeColor(playerAttr.attributeValue)}`}>
                          {playerAttr.attributeValue}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                  );
                })}

                {/* Goalkeeping column */}
                <td className="px-3 py-3 text-center">
                  <div className={`text-sm font-bold ${getAttributeColor(calculateCategoryAverage(player, 'goalkeeper'))} ${
                    expandedColumns.goalkeeper ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1' : ''
                  }`}>
                    {calculateCategoryAverage(player, 'goalkeeper') || '-'}
                  </div>
                </td>

                {expandedColumns.goalkeeper && getAttributeTemplate('goalkeeper').map(attrTemplate => {
                  const playerAttr = getAttributesByCategory(player, 'goalkeeper').find(a => a.attributeName === attrTemplate.attributeName);
                  return (
                    <td key={attrTemplate.attributeName} className="px-2 py-3 text-center">
                      {playerAttr ? (
                        <div className={`text-sm font-medium ${getAttributeColor(playerAttr.attributeValue)}`}>
                          {playerAttr.attributeValue}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                  );
                })}

                {/* Mental column */}
                <td className="px-3 py-3 text-center">
                  <div className={`text-sm font-bold ${getAttributeColor(calculateCategoryAverage(player, 'mental'))} ${
                    expandedColumns.mental ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1' : ''
                  }`}>
                    {calculateCategoryAverage(player, 'mental')}
                  </div>
                </td>

                {expandedColumns.mental && getAttributeTemplate('mental').map(attrTemplate => {
                  const playerAttr = getAttributesByCategory(player, 'mental').find(a => a.attributeName === attrTemplate.attributeName);
                  return (
                    <td key={attrTemplate.attributeName} className="px-2 py-3 text-center">
                      {playerAttr ? (
                        <div className={`text-sm font-medium ${getAttributeColor(playerAttr.attributeValue)}`}>
                          {playerAttr.attributeValue}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                  );
                })}

                {/* Physical column */}
                <td className="px-3 py-3 text-center">
                  <div className={`text-sm font-bold ${getAttributeColor(calculateCategoryAverage(player, 'physical'))} ${
                    expandedColumns.physical ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1' : ''
                  }`}>
                    {calculateCategoryAverage(player, 'physical')}
                  </div>
                </td>

                {expandedColumns.physical && getAttributeTemplate('physical').map(attrTemplate => {
                  const playerAttr = getAttributesByCategory(player, 'physical').find(a => a.attributeName === attrTemplate.attributeName);
                  return (
                    <td key={attrTemplate.attributeName} className="px-2 py-3 text-center">
                      {playerAttr ? (
                        <div className={`text-sm font-medium ${getAttributeColor(playerAttr.attributeValue)}`}>
                          {playerAttr.attributeValue}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};