<script lang="ts">
    
    import { Crypto } from "../crypto";

    var crypto: Crypto = new Crypto();

    enum Page {
        Main = 0,
        Use = 1,
        Configurations = 2
    }
    let active = Page.Main;

    let encryptTxt = ""; 
    let decryptTxt = "";

    let encryptOutput = "";
    let decryptOutput = "";

    let key = "";

    function copyEncrypted() {
        const node: HTMLElement = document.getElementById("encryptedOutput")!;

        const selection: Selection = document.getSelection()!;
        const range = document.createRange();

        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);

        navigator.clipboard.writeText(encryptOutput);
    }

    function copyDecrypted() {
        const node: HTMLElement = document.getElementById("decryptedOutput")!;

        const selection: Selection = document.getSelection()!;
        const range = document.createRange();

        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
        
        navigator.clipboard.writeText(decryptOutput);
    }

    function encrypt() {
        encryptOutput = crypto.encrypt(encryptTxt);
    }

    function decrypt() {
        decryptOutput = crypto.decrypt(decryptTxt);
    }

    function setKey() {
        crypto.setKey(key);
    }


</script>

<h1>Rusty-Crypto</h1>

<br />

{ #if active === Page.Use }

    <h2>Use</h2>

    <br />

    <h3>Encrypt: </h3>
    <input bind:value={encryptTxt} style="border: 2px solid gray; width:40vw;" />
    <button style="width:40vw;" on:click="{encrypt}">Submit</button>

    <h4>Output: </h4>
    <h4 id="encryptedOutput">{encryptOutput}</h4>
    <button style="width:40vw;" on:click="{copyEncrypted}">Copy</button>

    <br />
    <br />

    <h3>Decrypt: </h3>
    <input bind:value={decryptTxt} style="border: 2px solid gray; width:40vw;" />
    <button style="width:40vw;" on:click="{decrypt}">Submit</button>
    
    <h4>Output: </h4>
    <h4 id="decryptedOutput">{decryptOutput}</h4>
    <button style="width:40vw;" on:click="{copyDecrypted}">Copy</button>

    <br />
    <br />
    <br />

    <!-- svelte-ignore a11y-missing-attribute -->
    <p><a on:click={() => active=Page.Main}>Home</a></p>
    <!-- svelte-ignore a11y-missing-attribute -->
    <p><a on:click={() => active=Page.Configurations}>Configurations</a></p>

{ :else if active === Page.Configurations }

    <h2>Configurations</h2>

    <br />

    <h3>Set Key: </h3>
    <input value={key} style="border: 2px solid gray; width:40vw;" />
    <button style="width:40vw;" on:click="{setKey}">Submit</button>

    <br />
    <br />
    <br />

    <!-- svelte-ignore a11y-missing-attribute -->
    <p><a on:click={() => active=Page.Main}>Home</a></p>
    <!-- svelte-ignore a11y-missing-attribute -->
    <p><a on:click={() => active=Page.Use}>Use</a></p>

{ :else }

    <ul>
        <!-- svelte-ignore a11y-missing-attribute -->
        <li><a on:click={() => active=Page.Use}>Use</a></li>
        <!-- svelte-ignore a11y-missing-attribute -->
        <li><a on:click={() => active=Page.Configurations}>Configurations</a></li>
    </ul>

{ /if }

