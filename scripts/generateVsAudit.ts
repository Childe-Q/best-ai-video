import fs from 'node:fs';
import path from 'node:path';
import {
  buildVsAuditReport,
  buildVsCanonicalConsistencyReport,
  buildVsIndexVisibilityReport,
  buildVsMatrixReport,
} from '@/lib/vsAudit';

const outputDir = path.join(process.cwd(), '_audit', 'vs');
const outputPath = path.join(outputDir, 'after-report.md');
const matrixOutputPath = path.join(outputDir, 'matrix-report.md');
const canonicalConsistencyOutputPath = path.join(outputDir, 'canonical-consistency.md');
const indexVisibilityOutputPath = path.join(outputDir, 'index-visibility.md');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${buildVsAuditReport()}\n`, 'utf8');
fs.writeFileSync(matrixOutputPath, `${buildVsMatrixReport()}\n`, 'utf8');
fs.writeFileSync(canonicalConsistencyOutputPath, `${buildVsCanonicalConsistencyReport()}\n`, 'utf8');
fs.writeFileSync(indexVisibilityOutputPath, `${buildVsIndexVisibilityReport()}\n`, 'utf8');
