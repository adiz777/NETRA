import {
  getIdentity,
  createDossier,
  createTimeline,
  createNetwork,
  createExposure,
  createReport,
} from './index.js';

function usage(): void {
  console.log(`
NETRA Intelligence Platform

Usage:
  netra <command> <id>

Commands:
  identity <id>    Generate or retrieve an identity
  dossier <id>     Display an intelligence dossier
  timeline <id>   Display subject timeline
  network <id>     Display relationship network
  exposure <id>    Display digital exposure profile
  report <id>      Generate complete intelligence report

Examples:
  netra identity 10001
  netra dossier 10001
  netra timeline 10001
  netra network 10001
  netra exposure 10001
  netra report 10001
`);
}

function printJSON(value: unknown): void {
  console.log(
    JSON.stringify(value, null, 2),
  );
}

function main(): void {
  const [, , command, id] = process.argv;

  if (!command || !id) {
    usage();
    process.exitCode = 1;
    return;
  }

  const identity = getIdentity(id);

  switch (command.toLowerCase()) {
    case 'identity':
      printJSON(identity);
      break;

    case 'dossier':
      printJSON(createDossier(identity));
      break;

    case 'timeline':
      printJSON(createTimeline(identity));
      break;

    case 'network':
      printJSON(createNetwork(identity));
      break;

    case 'exposure':
      printJSON(createExposure(identity));
      break;

    case 'report':
      printJSON(createReport(identity));
      break;

    default:
      console.error(`Unknown NETRA command: ${command}`);
      usage();
      process.exitCode = 1;
  }
}

main();