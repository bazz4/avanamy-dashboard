'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileCode, RefreshCw, Split, Columns, Search, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { compareVersions, getSpecVersions } from '@/lib/api';
import * as Diff from 'diff';

export default function FullSchemaPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;
  const currentVersionId = parseInt(params.versionId as string);

  const [currentSpec, setCurrentSpec] = useState<any>(null);
  const [previousSpec, setPreviousSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  // New state for enhancements
  const [searchQuery, setSearchQuery] = useState('');
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  const [compareFrom, setCompareFrom] = useState<number>(currentVersionId - 1);
  const [compareTo, setCompareTo] = useState<number>(currentVersionId);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoaded) return;
    loadVersions();
  }, [isLoaded, specId]);

  useEffect(() => {
    if (availableVersions.length > 0) {
      loadSpecs();
    }
  }, [specId, compareFrom, compareTo, availableVersions]);

    // Fix: Reset state when navigating to different version
    useEffect(() => {
    setCompareFrom(currentVersionId - 1);
    setCompareTo(currentVersionId);
    setCurrentChangeIndex(0);
    }, [currentVersionId]);

    // Fix: Validate selected versions exist in available versions
    useEffect(() => {
    if (availableVersions.length > 0) {
        // Ensure compareFrom exists
        if (!availableVersions.includes(compareFrom)) {
        const validFrom = availableVersions
            .filter(v => v < compareTo)
            .sort((a, b) => b - a)[0] || availableVersions[0];
        setCompareFrom(validFrom);
        }
        // Ensure compareTo exists
        if (!availableVersions.includes(compareTo)) {
        setCompareTo(availableVersions[availableVersions.length - 1]);
        }
    }
    }, [availableVersions, compareFrom, compareTo]);

  const loadVersions = async () => {
    try {
      const versions = await getSpecVersions(specId);
      const versionNumbers = versions.map(v => v.version).sort((a, b) => a - b);
      setAvailableVersions(versionNumbers);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await compareVersions(specId, compareTo, compareFrom);
      setCurrentSpec(data.current_spec);
      setPreviousSpec(data.previous_spec);
      setError(null);
    } catch (err: any) {
      // Check if it's a missing artifact error
      const errorMessage = err?.response?.data?.detail;
      
      if (typeof errorMessage === 'object' && errorMessage.is_legacy_version) {
        setError(
          `Cannot compare legacy versions. ${errorMessage.suggestion || 
          'This version was created before full schema storage was implemented.'}`
        );
      } else if (typeof errorMessage === 'string' && errorMessage.includes('artifact not found')) {
        setError(
          'Full schema comparison is not available for these versions. ' +
          'They were created before this feature was implemented. Upload a new version to enable comparison.'
        );
      } else {
        setError('Failed to load specs');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading schemas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentSpec || !previousSpec) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Summary
          </button>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <FileCode className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">
                  Full Schema Comparison Not Available
                </h3>
                <p className="text-yellow-200/80 mb-4">
                  {error || 'Failed to load schemas'}
                </p>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-300 mb-2">
                    <strong>Why is this happening?</strong>
                  </p>
                  <p className="text-sm text-slate-400">
                    These versions were created before full schema storage was implemented. 
                    Only the summary diff is available for legacy versions.
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/specs/${specId}/versions/${compareTo}/diff`)}
                  className="mt-4 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg transition-all"
                >
                  View Summary Diff Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const previousJson = JSON.stringify(previousSpec, null, 2);
  const currentJson = JSON.stringify(currentSpec, null, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Summary
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>Home</span>
            <span>›</span>
            <span>Specs</span>
            <span>›</span>
            <span>Versions</span>
            <span>›</span>
            <span className="text-cyan-400">Full Schema</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <FileCode className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Full Schema Comparison
                </h1>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('unified')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'unified'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Split className="h-4 w-4" />
                Unified
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'split'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Columns className="h-4 w-4" />
                Split
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            {/* Version Selectors */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Compare:</label>
              <select
                value={compareFrom}
                onChange={(e) => setCompareFrom(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                {availableVersions.map(v => (
                  <option key={v} value={v}>v{v}</option>
                ))}
              </select>
              <span className="text-slate-500">→</span>
              <select
                value={compareTo}
                onChange={(e) => setCompareTo(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                {availableVersions.map(v => (
                  <option key={v} value={v}>v{v}</option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Search */}
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search in diff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Diff Display */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {viewMode === 'unified' ? (
            <UnifiedDiffView 
              previousJson={previousJson} 
              currentJson={currentJson}
              searchQuery={searchQuery}
              currentChangeIndex={currentChangeIndex}
              setCurrentChangeIndex={setCurrentChangeIndex}
              collapsedSections={collapsedSections}
              setCollapsedSections={setCollapsedSections}
            />
          ) : (
            <SplitDiffView 
              previousJson={previousJson} 
              currentJson={currentJson}
              searchQuery={searchQuery}
              collapsedSections={collapsedSections}
              setCollapsedSections={setCollapsedSections}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Unified Diff View Component with enhancements
function UnifiedDiffView({ 
  previousJson, 
  currentJson, 
  searchQuery,
  currentChangeIndex,
  setCurrentChangeIndex,
  collapsedSections,
  setCollapsedSections
}: { 
  previousJson: string; 
  currentJson: string;
  searchQuery: string;
  currentChangeIndex: number;
  setCurrentChangeIndex: (index: number) => void;
  collapsedSections: Set<string>;
  setCollapsedSections: (sections: Set<string>) => void;
}) {
  const diff = Diff.diffLines(previousJson, currentJson);
  const changeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find all changed lines
  const changedLineIndices = useMemo(() => {
    const indices: number[] = [];
    let lineNum = 0;
    diff.forEach(part => {
      const lines = part.value.split('\n').filter(line => line.length > 0);
      lines.forEach(() => {
        if (part.added || part.removed) {
          indices.push(lineNum);
        }
        lineNum++;
      });
    });
    return indices;
  }, [diff]);

  // Navigation functions
  const goToNextChange = () => {
    if (changedLineIndices.length === 0) return;
    const nextIndex = (currentChangeIndex + 1) % changedLineIndices.length;
    setCurrentChangeIndex(nextIndex);
    changeRefs.current[changedLineIndices[nextIndex]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const goToPreviousChange = () => {
    if (changedLineIndices.length === 0) return;
    const prevIndex = currentChangeIndex === 0 ? changedLineIndices.length - 1 : currentChangeIndex - 1;
    setCurrentChangeIndex(prevIndex);
    changeRefs.current[changedLineIndices[prevIndex]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Detect sections (paths in OpenAPI)
  const detectSection = (line: string): string | null => {
    const pathMatch = line.match(/^\s*"(\/[^"]*)":/);
    if (pathMatch) return pathMatch[1];
    
    const topLevelMatch = line.match(/^\s*"(paths|components|info|servers)":/);
    if (topLevelMatch) return topLevelMatch[1];
    
    return null;
  };

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const highlightSearch = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  let lineNum = 0;
  let currentSection: string | null = null;
  let sectionStartLine = 0;

  return (
    <div className="relative">
      {/* Navigation Controls */}
      {changedLineIndices.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2">
          <span className="text-sm text-slate-400">
            Change {currentChangeIndex + 1} of {changedLineIndices.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousChange}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm flex items-center gap-1"
            >
              <ChevronUp className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={goToNextChange}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm flex items-center gap-1"
            >
              Next
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="font-mono text-xs">
        {diff.map((part, idx) => {
          const lines = part.value.split('\n').filter(line => line.length > 0);
          
          return lines.map((line, lineIdx) => {
            const section = detectSection(line);
            if (section) {
              currentSection = section;
              sectionStartLine = lineNum;
            }

            const isCollapsed = currentSection && collapsedSections.has(currentSection) && lineNum > sectionStartLine;
            const isChanged = part.added || part.removed;
            const isHighlighted = changedLineIndices[currentChangeIndex] === lineNum;
            
            const element = (
              <div
                key={`${idx}-${lineIdx}`}
                ref={el => { changeRefs.current[lineNum] = el; }}
                className={`flex ${
                  isCollapsed ? 'hidden' : ''
                } ${
                  part.added
                    ? 'bg-green-500/20 dark:bg-green-500/20'
                    : part.removed
                    ? 'bg-red-500/20 dark:bg-red-500/20'
                    : ''
                } ${
                  isHighlighted ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
                  {lineNum + 1}
                </div>
                <div className="flex-1 px-4 py-1 flex items-start">
                  {section && lineNum === sectionStartLine && (
                    <button
                      onClick={() => toggleSection(section)}
                      className="mr-2 text-slate-400 hover:text-slate-300"
                    >
                      {collapsedSections.has(section) ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  {part.added && (
                    <span className="text-green-600 dark:text-green-400 mr-2">+</span>
                  )}
                  {part.removed && (
                    <span className="text-red-600 dark:text-red-400 mr-2">-</span>
                  )}
                  <pre
                    className={`whitespace-pre font-mono ${
                      part.added
                        ? 'text-green-700 dark:text-green-300'
                        : part.removed
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {highlightSearch(line)}
                  </pre>
                </div>
              </div>
            );

            lineNum++;
            return element;
          });
        })}
      </div>
    </div>
  );
}

// Split Diff View Component with highlighting
function SplitDiffView({ 
  previousJson, 
  currentJson,
  searchQuery,
  collapsedSections,
  setCollapsedSections
}: { 
  previousJson: string; 
  currentJson: string;
  searchQuery: string;
  collapsedSections: Set<string>;
  setCollapsedSections: (sections: Set<string>) => void;
}) {
  const previousLines = previousJson.split('\n');
  const currentLines = currentJson.split('\n');
  const diff = Diff.diffLines(previousJson, currentJson);
  
  // Build line-by-line change map
  const changes: Map<number, 'added' | 'removed' | 'context'> = new Map();
  let prevLineNum = 0;
  let currLineNum = 0;
  
  diff.forEach(part => {
    const lines = part.value.split('\n').filter(l => l.length > 0);
    
    if (part.removed) {
      lines.forEach(() => {
        changes.set(prevLineNum, 'removed');
        prevLineNum++;
      });
    } else if (part.added) {
      lines.forEach(() => {
        changes.set(currLineNum + 100000, 'added');
        currLineNum++;
      });
    } else {
      lines.forEach(() => {
        prevLineNum++;
        currLineNum++;
      });
    }
  });

  const highlightSearch = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
      {/* Previous Version */}
      <div>
        <div className="bg-slate-50 dark:bg-slate-950/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase">
            Previous Version
          </h3>
        </div>
        <div className="font-mono text-xs">
          {previousLines.map((line, idx) => {
            const isRemoved = changes.get(idx) === 'removed';
            return (
              <div 
                key={idx} 
                className={`flex ${isRemoved ? 'bg-red-500/20 dark:bg-red-500/20' : ''}`}
              >
                <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
                  {idx + 1}
                </div>
                <div className="flex-1 px-4 py-1 flex items-start">
                  {isRemoved && (
                    <span className="text-red-600 dark:text-red-400 mr-2">-</span>
                  )}
                  <pre className={`whitespace-pre font-mono ${
                    isRemoved 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {highlightSearch(line)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Version */}
      <div>
        <div className="bg-slate-50 dark:bg-slate-950/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase">
            Current Version
          </h3>
        </div>
        <div className="font-mono text-xs">
          {currentLines.map((line, idx) => {
            const isAdded = changes.get(idx + 100000) === 'added';
            return (
              <div 
                key={idx} 
                className={`flex ${isAdded ? 'bg-green-500/20 dark:bg-green-500/20' : ''}`}
              >
                <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
                  {idx + 1}
                </div>
                <div className="flex-1 px-4 py-1 flex items-start">
                  {isAdded && (
                    <span className="text-green-600 dark:text-green-400 mr-2">+</span>
                  )}
                  <pre className={`whitespace-pre font-mono ${
                    isAdded 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {highlightSearch(line)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}