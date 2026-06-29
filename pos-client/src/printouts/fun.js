export default {
    numberWithCommas(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    },
    chunkString (str, len) {
        const size = Math.ceil(str.length / len)
        const r = Array(size)
        let offset = 0

        for (let i = 0; i < size; i++) {
            r[i] = str.substr(offset, len)
            offset += len
        }

        return r
    },
}