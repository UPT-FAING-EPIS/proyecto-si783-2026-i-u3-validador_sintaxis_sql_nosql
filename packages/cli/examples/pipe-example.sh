#!/usr/bin/env bash
cat examples/consulta.sql | sqlcheck validate --stdin --engine mysql
