#!/usr/bin/env python3
import struct
import sys


def encode_leb128(v):
    r = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        if v:
            b |= 0x80
        r.append(b)
        if not (b & 0x80):
            break
    return bytes(r)


def decode_leb128(data, pos):
    val = shift = 0
    while True:
        b = data[pos]
        val |= (b & 0x7F) << shift
        shift += 7
        pos += 1
        if not (b & 0x80):
            break
    return val, pos


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

    header = wasm[:8]
    out = bytearray(header)

    pos = 8
    while pos < len(wasm):
        sid = wasm[pos]
        pos += 1
        sec_size, pos = decode_leb128(bytes(wasm), pos)
        sec_end = pos + sec_size

        skip = False
        if sid == 0 and sec_size > 0:
            nlen, tmp = decode_leb128(bytes(wasm), pos)
            name = bytes(wasm[tmp : tmp + nlen]).decode(errors="replace")
            if name == "contractmetav0":
                skip = True

        if not skip:
            out.append(sid)
            out.extend(encode_leb128(sec_size))
            out.extend(wasm[pos:sec_end])

        pos = sec_end

    new_meta = xdr_entry("source_repo", repo) + xdr_entry("source_rev", rev)
    name = b"contractmetav0"
    name_len_enc = encode_leb128(len(name))
    section = (
        bytes([0])
        + encode_leb128(len(name_len_enc) + len(name) + len(new_meta))
        + name_len_enc
        + name
        + new_meta
    )
    out.extend(section)

    with open(wasm_path, "wb") as f:
        f.write(bytes(out))
    print(f"  Injected SEP-58 metadata into {wasm_path}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} <wasm_path> <source_repo> <source_rev>")
        sys.exit(1)
    inject(sys.argv[1], sys.argv[2], sys.argv[3])
