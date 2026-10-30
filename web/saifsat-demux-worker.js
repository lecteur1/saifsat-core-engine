/**
 * SaifSat Universal Core Player - Background Demux Worker
 * Handles raw MPEG-TS chunk streaming & packet parsing off the main thread.
 */

self.onmessage = async function(e) {
    const { action, url } = e.data;

    if (action === 'FETCH_AND_DEMUX') {
        try {
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                self.postMessage({ type: 'ERROR', message: `HTTP Error: ${response.status}` });
                return;
            }

            const reader = response.body.getReader();
            let totalBytes = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    self.postMessage({ type: 'STREAM_DONE' });
                    break;
                }

                totalBytes += value.byteLength;

                // تمرير كتل البيانات المنفصلة للمعالجة المباشرة
                self.postMessage({
                    type: 'CHUNK_RECEIVED',
                    chunk: value.buffer,
                    size: totalBytes
                }, [value.buffer]); // Zero-Copy Transfer
            }
        } catch (err) {
            self.postMessage({ type: 'ERROR', message: err.message });
        }
    }
};