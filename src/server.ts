import http from "http";
import zlib from "zlib";
import { join } from "path";
import {
  resolveDeployment,
  fetchFileTreeRecursive,
  downloadFileContent,
  resolveFileUrl,
  runDownload,
  type FileNode,
  type DeploymentDetails,
} from "./download.js";

interface ZipEntry {
  path: string;
  data: Buffer;
}

function createZipBuffer(entries: ZipEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filenameBuf = Buffer.from(entry.path.replace(/\\/g, "/"), "utf8");
    const uncompressed = entry.data;
    const crc = zlib.crc32(uncompressed);
    const compressed = zlib.deflateRawSync(uncompressed);
    const useDeflate = compressed.length < uncompressed.length;
    const method = useDeflate ? 8 : 0;
    const body = useDeflate ? compressed : uncompressed;
    const compSize = body.length;
    const uncompSize = uncompressed.length;

    const local = Buffer.alloc(30 + filenameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compSize, 18);
    local.writeUInt32LE(uncompSize, 22);
    local.writeUInt16LE(filenameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    filenameBuf.copy(local, 30);

    const central = Buffer.alloc(46 + filenameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compSize, 20);
    central.writeUInt32LE(uncompSize, 24);
    central.writeUInt16LE(filenameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    filenameBuf.copy(central, 46);

    localHeaders.push(local, body);
    centralHeaders.push(central);
    offset += local.length + body.length;
  }

  const centralSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralSize, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, endRecord]);
}

function parseJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : ({} as T));
      } catch (err) {
        reject(new Error("Invalid JSON request body"));
      }
    });
    req.on("error", reject);
  });
}

function flattenTreeFiles(
  nodes: FileNode[],
  basePath: string = ""
): Array<{ name: string; fullPath: string; link?: string }> {
  const result: Array<{ name: string; fullPath: string; link?: string }> = [];
  for (const n of nodes) {
    const currentPath = basePath ? `${basePath}/${n.name}` : n.name;
    if (n.type === "file" && n.link) {
      result.push({ name: n.name, fullPath: currentPath, link: n.link });
    } else if (n.type === "directory" && n.children) {
      result.push(...flattenTreeFiles(n.children, currentPath));
    }
  }
  return result;
}

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PULL — Local Deployment Inspector</title>
  <style>
    :root {
      --bg: #000000;
      --card-bg: #0d0d0d;
      --card-hover: #141414;
      --border: #222222;
      --border-focus: #444444;
      --text: #ededed;
      --muted: #888888;
      --accent: #ededed;
      --cyan: #38bdf8;
      --green: #34d399;
      --red: #f43f5e;
      --font-mono: "SF Mono", Menlo, Consolas, Monaco, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Geist", Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      width: 100%;
      max-width: 960px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #fff;
      background: #111;
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 6px;
      font-family: var(--font-mono);
    }
    .brand-tagline {
      font-size: 13px;
      color: var(--muted);
    }
    .gh-link {
      font-size: 13px;
      color: var(--muted);
      text-decoration: none;
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .gh-link:hover {
      color: #fff;
      border-color: #555;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 24px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
      display: flex;
      justify-content: space-between;
    }
    .label a {
      color: var(--cyan);
      text-decoration: none;
    }
    .label a:hover { text-decoration: underline; }
    input[type="text"], input[type="password"] {
      background: #000;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 14px;
      color: #fff;
      font-family: var(--font-mono);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input[type="text"]:focus, input[type="password"]:focus {
      border-color: var(--border-focus);
    }
    .btn-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    button {
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      padding: 10px 18px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #ededed;
      color: #000;
      border: 1px solid #ededed;
    }
    .btn-primary:hover {
      background: #fff;
      color: #000;
    }
    .btn-secondary {
      background: #111;
      color: #ededed;
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: #1a1a1a;
      border-color: #444;
    }
    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .stat-box {
      background: #050505;
      border: 1px solid var(--border);
      padding: 12px;
      border-radius: 6px;
    }
    .stat-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-size: 15px;
      font-weight: 700;
      font-family: var(--font-mono);
      color: #fff;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .progress-box {
      margin-top: 16px;
      display: none;
    }
    .progress-bar-bg {
      background: #111;
      border: 1px solid var(--border);
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      background: var(--cyan);
      height: 100%;
      width: 0%;
      transition: width 0.1s linear;
    }
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
      font-family: var(--font-mono);
    }
    .tree-viewer {
      margin-top: 16px;
      background: #050505;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 12px;
      max-height: 480px;
      overflow-y: auto;
    }
    .tree-node {
      padding: 3px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ccc;
      user-select: none;
    }
    .tree-node.dir {
      cursor: pointer;
      color: #ededed;
      font-weight: 500;
    }
    .tree-node.dir:hover { color: #fff; }
    .tree-node.file:hover { color: var(--cyan); cursor: pointer; }
    .tree-children {
      margin-left: 18px;
      border-left: 1px solid #1a1a1a;
      padding-left: 8px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #181818;
      border: 1px solid var(--border);
      color: var(--muted);
    }
    .search-input {
      margin-bottom: 12px;
      width: 100%;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .modal-box {
      background: #0d0d0d;
      border: 1px solid var(--border);
      border-radius: 10px;
      width: 100%;
      max-width: 800px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--font-mono);
      font-size: 13px;
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.5;
      white-space: pre;
      color: #ddd;
    }
    .status-text {
      font-size: 12px;
      color: var(--muted);
      margin-top: 10px;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">PULL</div>
        <div class="brand-tagline">Vercel Deployment Inspector & Source Extractor</div>
      </div>
      <a class="gh-link" href="https://github.com/carbonthecoder/PULL" target="_blank" rel="noopener">
        GitHub ↗
      </a>
    </div>

    <div class="card">
      <div class="card-title">
        <span>Target Deployment</span>
        <span class="badge" id="connStatus">Idle</span>
      </div>

      <div class="form-grid">
        <div class="field">
          <div class="label">
            <span>Vercel API Token</span>
            <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener">Create Token ↗</a>
          </div>
          <input type="password" id="tokenInput" placeholder="vcp_... or vercel token" />
        </div>

        <div class="field">
          <div class="label">
            <span>Deployment ID or Dashboard URL</span>
            <span style="color: #666">dpl_xxx or full vercel.com url</span>
          </div>
          <input type="text" id="deployInput" placeholder="dpl_xxx or vercel.com/scope/project/id/source or latest" />
        </div>
      </div>

      <div class="btn-group">
        <button class="btn-primary" id="btnInspect" onclick="inspectTree()">
          <span>Inspect Source Tree</span>
        </button>
        <button class="btn-secondary" id="btnZip" onclick="downloadZip()">
          <span>Download ZIP Archive</span>
        </button>
        <button class="btn-secondary" id="btnExtract" onclick="extractToDisk()">
          <span>Extract to Local Disk</span>
        </button>
      </div>

      <div class="status-text" id="statusMessage"></div>

      <div class="progress-box" id="progressBox">
        <div class="progress-label">
          <span id="progressFile">Processing...</span>
          <span id="progressPct">0%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progressFill"></div>
        </div>
      </div>

      <div class="stats-bar" id="statsBar" style="display: none;">
        <div class="stat-box">
          <div class="stat-label">Project</div>
          <div class="stat-val" id="statProject">—</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Deployment</div>
          <div class="stat-val" id="statDeploy">—</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Files</div>
          <div class="stat-val" id="statTotal">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Status</div>
          <div class="stat-val" id="statStatus">Ready</div>
        </div>
      </div>
    </div>

    <div class="card" id="treeCard" style="display: none;">
      <div class="card-title">
        <span>File Tree Hierarchy</span>
        <div>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="toggleAllDirs(true)">Expand</button>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="toggleAllDirs(false)">Collapse</button>
        </div>
      </div>
      <input type="text" class="search-input" id="treeSearch" placeholder="Filter files (e.g. .tsx, components, api)..." oninput="filterTree()" />
      <div class="tree-viewer" id="treeViewer"></div>
    </div>
  </div>

  <div class="modal" id="previewModal" onclick="closeModal(event)">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div class="modal-header">
        <span id="modalPath">File Preview</span>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="closeModal()">Close ✕</button>
      </div>
      <div class="modal-body" id="modalContent">Loading...</div>
    </div>
  </div>

  <script>
    let currentTree = [];
    let currentDetails = null;

    window.addEventListener('DOMContentLoaded', () => {
      const savedToken = localStorage.getItem('pull_vercel_token');
      if (savedToken) document.getElementById('tokenInput').value = savedToken;
      const savedDeploy = localStorage.getItem('pull_last_deploy');
      if (savedDeploy) document.getElementById('deployInput').value = savedDeploy;
    });

    function saveInputs(token, deploy) {
      if (token) localStorage.setItem('pull_vercel_token', token);
      if (deploy) localStorage.setItem('pull_last_deploy', deploy);
    }

    function setStatus(msg, isError = false) {
      const el = document.getElementById('statusMessage');
      el.textContent = msg;
      el.style.color = isError ? 'var(--red)' : 'var(--muted)';
      const badge = document.getElementById('connStatus');
      badge.textContent = isError ? 'Error' : (msg ? 'Active' : 'Idle');
      badge.style.color = isError ? 'var(--red)' : (msg ? 'var(--cyan)' : 'var(--muted)');
    }

    async function inspectTree() {
      const token = document.getElementById('tokenInput').value.trim();
      const deployment = document.getElementById('deployInput').value.trim();
      if (!token) return setStatus('Vercel API token is required', true);

      saveInputs(token, deployment);
      setStatus('Resolving deployment and fetching file hierarchy...');
      document.getElementById('btnInspect').disabled = true;

      try {
        const res = await fetch('/api/tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deployment })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to inspect deployment');

        currentTree = data.tree;
        currentDetails = data.deployment;

        document.getElementById('statProject').textContent = currentDetails.projectName || '—';
        document.getElementById('statDeploy').textContent = currentDetails.deploymentId || '—';
        document.getElementById('statTotal').textContent = data.totalFiles || countFiles(currentTree);
        document.getElementById('statStatus').textContent = 'Ready';
        document.getElementById('statsBar').style.display = 'grid';

        renderTree(currentTree);
        document.getElementById('treeCard').style.display = 'block';
        setStatus(\`Tree loaded: \${data.totalFiles || countFiles(currentTree)} files located.\`);
      } catch (err) {
        setStatus(err.message, true);
      } finally {
        document.getElementById('btnInspect').disabled = false;
      }
    }

    function countFiles(nodes) {
      let c = 0;
      for (const n of nodes) {
        if (n.type === 'file') c++;
        if (n.type === 'directory' && n.children) c += countFiles(n.children);
      }
      return c;
    }

    function renderTree(nodes, container = document.getElementById('treeViewer'), path = '') {
      container.innerHTML = '';
      function build(list, parentEl, curPath) {
        for (const item of list) {
          const itemPath = curPath ? \`\${curPath}/\${item.name}\` : item.name;
          const nodeEl = document.createElement('div');
          nodeEl.className = 'tree-item';
          nodeEl.dataset.path = itemPath.toLowerCase();

          const labelEl = document.createElement('div');
          labelEl.className = \`tree-node \${item.type === 'directory' ? 'dir' : 'file'}\`;

          if (item.type === 'directory') {
            labelEl.innerHTML = \`<span class="icon">📁</span> \${item.name}\`;
            const childrenEl = document.createElement('div');
            childrenEl.className = 'tree-children';
            labelEl.onclick = () => {
              const hidden = childrenEl.style.display === 'none';
              childrenEl.style.display = hidden ? 'block' : 'none';
              labelEl.querySelector('.icon').textContent = hidden ? '📁' : '📂';
            };
            nodeEl.appendChild(labelEl);
            nodeEl.appendChild(childrenEl);
            if (item.children) build(item.children, childrenEl, itemPath);
          } else {
            labelEl.innerHTML = \`<span class="icon">📄</span> \${item.name}\`;
            labelEl.onclick = () => previewFile(itemPath, item.link);
            nodeEl.appendChild(labelEl);
          }
          parentEl.appendChild(nodeEl);
        }
      }
      build(nodes, container, path);
    }

    function filterTree() {
      const q = document.getElementById('treeSearch').value.toLowerCase().trim();
      const items = document.querySelectorAll('#treeViewer .tree-item');
      items.forEach(el => {
        if (!q) {
          el.style.display = '';
          return;
        }
        const matches = el.dataset.path && el.dataset.path.includes(q);
        el.style.display = matches ? '' : 'none';
      });
    }

    function toggleAllDirs(open) {
      document.querySelectorAll('#treeViewer .tree-children').forEach(el => {
        el.style.display = open ? 'block' : 'none';
      });
      document.querySelectorAll('#treeViewer .tree-node.dir .icon').forEach(el => {
        el.textContent = open ? '📁' : '📂';
      });
    }

    async function previewFile(filePath, link) {
      if (!link) return;
      const token = document.getElementById('tokenInput').value.trim();
      document.getElementById('modalPath').textContent = filePath;
      document.getElementById('modalContent').textContent = 'Fetching file contents...';
      document.getElementById('previewModal').style.display = 'flex';

      try {
        const res = await fetch(\`/api/file?link=\${encodeURIComponent(link)}&token=\${encodeURIComponent(token)}&deploymentId=\${encodeURIComponent(currentDetails.deploymentId)}&teamId=\${encodeURIComponent(currentDetails.teamId || '')}\`);
        if (!res.ok) throw new Error('Failed to load file');
        const text = await res.text();
        document.getElementById('modalContent').textContent = text;
      } catch (err) {
        document.getElementById('modalContent').textContent = \`Error loading file: \${err.message}\`;
      }
    }

    function closeModal() {
      document.getElementById('previewModal').style.display = 'none';
    }

    async function downloadZip() {
      const token = document.getElementById('tokenInput').value.trim();
      const deployment = document.getElementById('deployInput').value.trim();
      if (!token) return setStatus('Vercel API token is required', true);

      saveInputs(token, deployment);
      setStatus('Generating ZIP archive... please wait.');
      document.getElementById('btnZip').disabled = true;

      try {
        const res = await fetch('/api/zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deployment })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to generate ZIP');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const filename = (currentDetails && currentDetails.projectName ? currentDetails.projectName : 'pull-source') + '.zip';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setStatus(\`Downloaded \${filename} successfully!\`);
      } catch (err) {
        setStatus(err.message, true);
      } finally {
        document.getElementById('btnZip').disabled = false;
      }
    }

    async function extractToDisk() {
      const token = document.getElementById('tokenInput').value.trim();
      const deployment = document.getElementById('deployInput').value.trim();
      if (!token) return setStatus('Vercel API token is required', true);

      saveInputs(token, deployment);
      setStatus('Starting local disk extraction...');
      document.getElementById('btnExtract').disabled = true;
      const progressBox = document.getElementById('progressBox');
      const progressFill = document.getElementById('progressFill');
      const progressPct = document.getElementById('progressPct');
      const progressFile = document.getElementById('progressFile');
      progressBox.style.display = 'block';

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deployment })
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'status') {
                  setStatus(event.msg);
                } else if (event.type === 'progress') {
                  progressFile.textContent = event.current || 'Downloading...';
                  const pct = event.total > 0 ? Math.round(((event.downloaded + event.skipped + event.failed) / event.total) * 100) : 0;
                  progressFill.style.width = pct + '%';
                  progressPct.textContent = pct + '%';
                } else if (event.type === 'done') {
                  progressFill.style.width = '100%';
                  progressPct.textContent = '100%';
                  setStatus(\`Extraction completed! Pulled: \${event.stats.downloaded}, Skipped: \${event.stats.skipped}, Target: \${event.stats.outputDir}\`);
                } else if (event.type === 'error') {
                  setStatus(event.msg, true);
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        setStatus(err.message, true);
      } finally {
        document.getElementById('btnExtract').disabled = false;
      }
    }
  </script>
</body>
</html>`;

export function startServer(port: number = 3000): http.Server {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = parsedUrl.pathname;

    // CORS headers for local inspection
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(DASHBOARD_HTML);
      return;
    }

    if (req.method === "GET" && pathname === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", app: "pull", version: "2.0.0" }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/tree") {
      try {
        const body = await parseJsonBody<{ token: string; deployment: string }>(req);
        if (!body.token) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing required token" }));
          return;
        }
        const deploymentInput = body.deployment || "latest";
        const details = await resolveDeployment(body.token, deploymentInput);
        const tree = await fetchFileTreeRecursive(body.token, details.deploymentUrl, details.teamId);

        const countNodes = (nodes: FileNode[]): number => {
          let count = 0;
          for (const n of nodes) {
            if (n.type === "file") count++;
            if (n.type === "directory" && n.children) count += countNodes(n.children);
          }
          return count;
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            deployment: details,
            tree,
            totalFiles: countNodes(tree),
          })
        );
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Failed to inspect tree" }));
      }
      return;
    }

    if (req.method === "GET" && pathname === "/api/file") {
      const link = parsedUrl.searchParams.get("link");
      const token = parsedUrl.searchParams.get("token");
      const deploymentId = parsedUrl.searchParams.get("deploymentId");
      const teamId = parsedUrl.searchParams.get("teamId") || "";

      if (!link || !token || !deploymentId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing link, token, or deploymentId" }));
        return;
      }

      try {
        const resolvedUrl = resolveFileUrl(link, deploymentId, teamId);
        if (!resolvedUrl) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Unable to resolve file url");
          return;
        }
        const content = await downloadFileContent(resolvedUrl, token);
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(content);
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(err.message || "Failed to download file");
      }
      return;
    }

    if (req.method === "POST" && pathname === "/api/zip") {
      try {
        const body = await parseJsonBody<{ token: string; deployment: string }>(req);
        if (!body.token) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing token" }));
          return;
        }
        const deploymentInput = body.deployment || "latest";
        const details = await resolveDeployment(body.token, deploymentInput);
        const tree = await fetchFileTreeRecursive(body.token, details.deploymentUrl, details.teamId);
        const flatFiles = flattenTreeFiles(tree);

        const zipEntries: ZipEntry[] = [];
        for (const f of flatFiles) {
          if (!f.link) continue;
          const resolved = resolveFileUrl(f.link, details.deploymentId, details.teamId);
          if (!resolved) continue;
          try {
            const buf = await downloadFileContent(resolved, body.token);
            zipEntries.push({ path: f.fullPath, data: buf });
          } catch {
            // continue on individual file failures
          }
        }

        const zipBuffer = createZipBuffer(zipEntries);
        const filename = `${details.projectName || details.deploymentId || "source"}.zip`;
        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": zipBuffer.length,
        });
        res.end(zipBuffer);
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Failed to create zip" }));
      }
      return;
    }

    if (req.method === "POST" && pathname === "/api/extract") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const body = await parseJsonBody<{ token: string; deployment: string; outputDir?: string }>(req);
        if (!body.token) {
          sendEvent({ type: "error", msg: "Missing token" });
          res.end();
          return;
        }

        const out = body.outputDir || join(process.cwd(), "pull");
        let totalCount = 0;

        await runDownload(body.token, body.deployment || "latest", out, {
          onStatus: (msg) => sendEvent({ type: "status", msg }),
          onFileStart: (_name, total) => {
            totalCount = total;
            sendEvent({ type: "fileStart", total });
          },
          onFileDone: (kind, path) => sendEvent({ type: "fileDone", kind, path }),
          onProgress: (dl, sk, fa, current) => {
            sendEvent({
              type: "progress",
              downloaded: dl,
              skipped: sk,
              failed: fa,
              total: totalCount,
              current,
            });
          },
          onDone: (stats) => {
            sendEvent({ type: "done", stats });
            res.end();
          },
          onError: (msg) => {
            sendEvent({ type: "error", msg });
            res.end();
          },
        });
      } catch (err: any) {
        sendEvent({ type: "error", msg: err.message || "Extraction error" });
        res.end();
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(port, () => {
    console.log(`\n\x1b[36m  PULL Local Inspector running at http://localhost:${port}\x1b[0m\n`);
  });

  return server;
}

// Standalone execution support
const isMain = process.argv[1] && process.argv[1].endsWith("server.ts");
if (isMain || process.argv.includes("--serve") || process.argv.includes("server")) {
  const port = parseInt(process.env.PORT || "3000", 10);
  startServer(port);
}
