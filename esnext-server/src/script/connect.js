const esnextConnectModule = `
console.log("esnext-connect");
`

module.exports.esnextConnectScript = `
    <script type="module">${esnextConnectModule}</script>
`.trim();