
const IMAGE_WIDTH = 256;
const IMAGE_HEIGHT = 288;
const IMAGE_DEPTH = 8;
const IMAGE_START_SIGNATURE = new Uint8Array([0xAA]);

async function assembleBMPHeader(width, height, depth, includePalette = false) {
    const BMP_HEADER_SIZE = 54;
    const TYPICAL_PIXELS_PER_METER = 2835;

    const fileSize = includePalette ? BMP_HEADER_SIZE + (4 * Math.pow(2, depth)) + (Math.ceil((depth * width + 31) / 32) * 4 * height) :
        BMP_HEADER_SIZE + (Math.ceil((depth * width + 31) / 32) * 4 * height);
    const rasterOffset = includePalette ? BMP_HEADER_SIZE + (4 * Math.pow(2, depth)) : BMP_HEADER_SIZE;

    const bmpHeader = new ArrayBuffer(BMP_HEADER_SIZE);
    const headerView = new DataView(bmpHeader);
    headerView.setUint8(0, 0x42); // "B"
    headerView.setUint8(1, 0x4D); // "M"
    headerView.setUint32(2, fileSize, true);
    headerView.setUint32(10, rasterOffset, true);
    headerView.setUint32(14, 40, true);
    headerView.setUint32(18, width, true);
    headerView.setInt32(22, -height, true);
    headerView.setUint16(26, 1, true);
    headerView.setUint16(28, depth, true);
    headerView.setUint32(34, Math.ceil((depth * width + 31) / 32) * 4 * height, true);
    headerView.setUint32(38, TYPICAL_PIXELS_PER_METER, true);
    headerView.setUint32(42, TYPICAL_PIXELS_PER_METER, true);

    if (includePalette) {
        const bmpPalette = new Uint8Array(4 * Math.pow(2, depth));
        for (let index = 0; index < Math.pow(2, depth); index++) {
            bmpPalette[index * 4] = index;
            bmpPalette[index * 4 + 1] = index;
            bmpPalette[index * 4 + 2] = index;
            bmpPalette[index * 4 + 3] = index;
        }
        return [bmpHeader, bmpPalette.buffer];
    }

    return bmpHeader;
}

async function getFingerprintImage(port, outputFileName) {
    const writer = port.writable.getWriter();
    const fileStream = await fetch(outputFileName, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' } });
    const outFileWriter = fileStream.body.getWriter();

    await writer.write(IMAGE_START_SIGNATURE);

    let receivedHeader = false;
    let totalBytesExpected = 0;

    while (true) {
        const { value, done } = await port.readable.getReader().read();
        if (done) break;

        if (!receivedHeader) {
            if (value.length > 0 && value[0] === IMAGE_START_SIGNATURE[0]) {
                const [header, palette] = await assembleBMPHeader(IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_DEPTH, true);
                await outFileWriter.write(header);
                if (palette) await outFileWriter.write(palette);
                receivedHeader = true;
                totalBytesExpected = Math.ceil((IMAGE_WIDTH * IMAGE_HEIGHT) / 2);
            }
        } else {
            await outFileWriter.write(value);
            totalBytesExpected -= value.length;
            if (totalBytesExpected <= 0) {
                await writer.releaseLock();
                await outFileWriter.close();
                console.log(`Image saved to ${outputFileName}`);
                break;
            }
        }
    }

    await port.close();
}

async function requestSerialPortAndFetchImage(outputFileName) {
    console.log(outputFileName);
    console.log(port);
    try {
        await getFingerprintImage(port, outputFileName);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage: requestSerialPortAndFetchImage('print.bmp');
