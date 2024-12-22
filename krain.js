const fs = require('fs');
const { Keypair } = require('@solana/web3.js');
const readline = require('readline');
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

// Banner
console.log(`
███████╗███████╗██████╗  ██████╗     ██████╗ ██████╗  ██████╗ ██████╗ 
╚══███╔╝██╔════╝██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
  ███╔╝ █████╗  ██████╔╝██║   ██║    ██║  ██║██████╔╝██║   ██║██████╔╝
 ███╔╝  ██╔══╝  ██╔══██╗██║   ██║    ██║  ██║██╔══██╗██║   ██║██╔═══╝ 
███████╗███████╗██║  ██║╚██████╔╝    ██████╔╝██║  ██║╚██████╔╝██║     
╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝     ╚═════╝ ╚═╝  ╚═════╝ ╚═╝     
                                                                       
`);

console.log("Join: https://airdrop.krain.ai/");

// Fungsi untuk membaca input dari pengguna
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
}

// Fungsi untuk membaca proxy dari file
function loadProxies(filePath) {
    try {
        const proxies = fs.readFileSync(filePath, 'utf-8').split('\n').filter(line => line.trim() !== '');
        return proxies;
    } catch (error) {
        console.error('Gagal membaca file proxies:', error.message);
        return [];
    }
}

// Fungsi untuk membuat wallet Solana
function createSolanaWallet() {
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toString();
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');

    return { address, privateKey };
}

// Fungsi untuk menyimpan wallet ke file
function saveWalletToFile(wallets) {
    const addresses = wallets.map(wallet => wallet.address).join('\n');
    const privateKeys = wallets.map(wallet => wallet.privateKey).join('\n');

    fs.writeFileSync('address.txt', addresses);
    fs.writeFileSync('privatekey.txt', privateKeys);

    console.log(`Berhasil membuat ${wallets.length} wallet dan menyimpannya ke file!`);
}

// Fungsi untuk submit data ke API
async function submitData(address, referredByCode, proxy) {
    const url = referredByCode ? `https://airdrop.krain.ai/${referredByCode}` : 'https://airdrop.krain.ai/';
    const headers = {
        "accept": "text/x-component",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
        "content-type": "text/plain;charset=UTF-8",
        "next-action": "400d6f0c58e5b7a361e70b3e4fe502f50ab36902e2",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": referredByCode ? `https://airdrop.krain.ai/${referredByCode}` : 'https://airdrop.krain.ai/',
        "Referrer-Policy": "strict-origin-when-cross-origin"
    };

    const body = JSON.stringify([{
        address,
        referredByCode: referredByCode || null
    }]);

    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
        console.log(`Mencoba mengirim data untuk wallet: ${address}`);
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
            agent
        });

        if (response.ok) {
            console.log(`Berhasil submit wallet: ${address}`);
        } else {
            console.error(`Gagal submit wallet: ${address}, Status: ${response.status}`);
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

// Fungsi utama untuk menjalankan program
(async () => {
    const numberOfWallets = parseInt(await askQuestion('Berapa jumlah wallet yang ingin dibuat? '), 10);

    if (isNaN(numberOfWallets) || numberOfWallets <= 0) {
        console.error('Jumlah wallet harus berupa angka positif.');
        return;
    }

    const useReff = (await askQuestion('Pake kode reff? (y/n): ')).toLowerCase() === 'y';
    let referredByCode = null;

    if (useReff) {
        referredByCode = await askQuestion('Masukkan kode referal Anda: ');

        if (!referredByCode) {
            console.error('Kode referal tidak boleh kosong.');
            return;
        }
    }

    const proxies = loadProxies('proxies.txt');
    const wallets = [];

    // Buat wallet Solana sebanyak numberOfWallets
    for (let i = 0; i < numberOfWallets; i++) {
        const wallet = createSolanaWallet();
        wallets.push(wallet);
    }

    // Simpan wallet ke file
    saveWalletToFile(wallets);

    // Submit data menggunakan proxy jika tersedia
    for (let i = 0; i < wallets.length; i++) {
        const proxy = proxies.length > 0 ? proxies[i % proxies.length] : null;
        await submitData(wallets[i].address, referredByCode, proxy);
    }
})();
