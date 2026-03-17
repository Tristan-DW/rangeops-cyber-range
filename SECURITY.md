# Security Policy

## Supported versions

This repository is pre-1.0 and currently supports only the latest `main` branch.

## Reporting vulnerabilities

If you discover a security issue, do not open a public issue with exploit details.

Report privately with:

- a clear description of the issue
- impact and affected components
- reproduction steps or proof of concept
- any proposed mitigations

The maintainers will acknowledge the report and work on a fix before public disclosure.

## Hardening notes

- Labs should run in isolated environments.
- Never run untrusted payloads outside sandboxed lab runtimes.
- Rotate secrets used in CI/CD and local environments.
