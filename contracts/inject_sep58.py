#!/usr/bin/env python3
import struct
import sys


def encode_leb128_u32(v):
    r = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        if v:
            b |= 0x80
        r.append(b)
        if not (v & 0x80):
            break
    return bytes(r)


def xdr_pad(d):
    return d + b"\x00" * ((4 - len(d) % 4) % 4)


def xdr_string(s):
    b = s.encode()
    return struct.pack(">I", len(b)) + xdr_pad(b)


def xdr_entry(k, v):
    return struct.pack(">I", 0) + xdr_string(k) + xdr_string(v)


def inject(wasm_path, repo, rev):
    with open(wasm_path, "rb") as f:
        wasm = bytearray(f.read())
    meta = xdr_entry("source_repo", repo) + xdr_entry("source_rev", rev)
    name = b"contractmetav0"
    section = (
        bytes([0])
        + encode_leb128_u32(len(name) + len(meta))
        + encode_leb128_u32(len(name))
        + name
        + meta
    )
    pos = 8
    while pos < len(wasm):
        sid = wasm[pos]
        pos += 1
        size = shift = 0
        while True:
            byte = wasm[pos]
            size |= (byte & 0x7F) << shift
            shift += 7
            pos += 1
            if not (byte & 0x80):
                break
        pos += size
    with open(wasm_path, "wb") as f:
        f.write(bytes(wasm[:pos]) + section + bytes(wasm[pos:]))
    print(f"  Injected SEP-58 metadata into {wasm_path}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} <wasm_path> <source_repo> <source_rev>")
        sys.exit(1)
    inject(sys.argv[1], sys.argv[2], sys.argv[3])
