const fs = require('node:fs');

function validateBranchFlow({ base, head, headRepository, repository }) {
  if (base === 'develop') {
    if (headRepository === repository && ['develop', 'preview', 'main'].includes(head)) {
      return 'Änderungen müssen aus einem Arbeitsbranch per PR nach develop kommen.';
    }
    return null;
  }
  const source = { preview: 'develop', main: 'preview' }[base];
  if (!source) return 'Erlaubte PR-Ziele sind develop, preview und main.';
  if (head !== source || headRepository !== repository) {
    return `Nach ${base} darf ausschließlich ${source} aus diesem Repository übernommen werden.`;
  }
  return null;
}

if (require.main === module) {
  if (process.env.GITHUB_EVENT_NAME !== 'pull_request') {
    console.log('Push/manual run: PR branch routing does not apply.');
  } else {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const pr = event.pull_request;
    const error = validateBranchFlow({
      base: pr.base.ref,
      head: pr.head.ref,
      headRepository: pr.head.repo?.full_name,
      repository: process.env.GITHUB_REPOSITORY,
    });
    if (error) {
      console.error(error);
      process.exitCode = 1;
    } else {
      console.log(`PR routing valid: ${pr.head.ref} -> ${pr.base.ref}`);
    }
  }
}

module.exports = { validateBranchFlow };
