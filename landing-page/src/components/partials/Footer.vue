<template>
  <div>
    <div v-for="html in this.alternativePageContent.tracking.html" :key="html">
      <div v-html="html" class="hidden"></div>
    </div>
    <div v-if="this.alternativePageContent.footerHtml" v-html="this.alternativePageContent.footerHtml"></div>
    <div v-else>
      <footer class="l-footer"
              aria-label="Footer">
        <div class="row">
          <div class="col-6">
            <p>
              <router-link to="/dokumentace">Technická dokumentace</router-link>
            </p>
            <p><a href="/login">Vstup do administrace</a></p>
          </div>
          <div class="col-6 text-right">
            <nav>
              <p>Vyvinuto na <a href="https://www.mfcr.cz/">Ministerstvu financí ČR</a></p>
              <p>Provozují <a href="https://www.otevrenamesta.cz/">Otevřená města, z.s.</a></p>
              <p>Servery poskytuje <a href="https://vpsfree.cz/" class="text-black"><span
                  style="color:#f6914b">vps</span><span style="color:#000">Free.cz, z.s.</span></a></p>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ComponentsPartialsFooter',
  props: {},
  mounted: function () {
    this.alternativePageContent.tracking.scripts.forEach(script => {
      script = script.replace(/^<script>/, "").replace(/<\/script>$/, "")
      eval(script)
    })
  }
}
</script>