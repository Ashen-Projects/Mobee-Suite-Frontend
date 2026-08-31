#!/usr/bin/env bash
set -Eeuo pipefail

release_sha="${1:?Release SHA is required}"
release_root='/www/projects/Mobee-Suite-Frontend/releases'
release_dir="$release_root/$release_sha"
www_parent='/www/wwwroot'
web_root="$www_parent/suite.mobee.lk"
next_root="$www_parent/.suite.mobee.lk.next-$release_sha"
backup_root="$www_parent/.suite.mobee.lk.previous"
switched='false'

rollback() {
  exit_code=$?
  if [[ "$switched" == 'true' && -d "$backup_root" ]]; then
    failed_root="$www_parent/.suite.mobee.lk.failed-$release_sha"
    mv "$web_root" "$failed_root"
    mv "$backup_root" "$web_root"
  fi
  exit "$exit_code"
}
trap rollback ERR

test -f "$release_dir/index.html"
rm -rf -- "$next_root"
mkdir -p "$next_root"
cp -a "$release_dir/." "$next_root/"
chown -R www:www "$next_root"

rm -rf -- "$backup_root"
if [[ -d "$web_root" ]]; then
  mv "$web_root" "$backup_root"
fi
mv "$next_root" "$web_root"
switched='true'

curl --fail --silent --show-error --retry 5 --retry-delay 2 \
  https://suite.mobee.lk/ >/dev/null

switched='false'
find "$release_root" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr \
  | tail -n +6 \
  | cut -d' ' -f2- \
  | xargs -r rm -rf --
