<template>
  <b-container>
    <b-row v-if="loading">
        <b-col>
          <div class="text-center">
            <b-spinner class="loading-right-margin"></b-spinner><span>Načítání zapojených obcí...</span>
          </div>
        </b-col>
    </b-row>
    <div v-if="!loading">
      <b-row>
        <h2>
          Zapojené obce
        </h2>
      </b-row>
      <b-row>
        <b-col v-for="city in cities" :key="city.name" class="city-item-margin-top text-justify" md="4" sm="6" xl="3">
          <b-row cols="12" no-gutters>
              <b-col class="city-item-icon-right-margin" cols="1">
                <a :target="city.type == 'external' ? '_blank' : ''" :href="city.url">
                  <img src="@/assets/images/pages/home/city_avatar.svg">
                </a>
              </b-col>
              <b-col cols="10">
                <a :target="city.type == 'external' ? '_blank' : ''" :href="city.url">
                  <b>{{ city.name }}</b>
                </a>
              </b-col>
          </b-row>
        </b-col>
      </b-row>
    </div>
  </b-container>
</template>

<script>
import axios from "axios";
export default {
  name: 'ActiveCities',
  props: {},
  data() {
    return {
      cities: [],
      loading: true
    }
  },
  mounted() {
    axios.get(`${this.apiBaseUrl}/public/profiles`, { params: { status: "visible"}})
        .then((response) => {
          this.cities = response.data.map(city => {
              return {
                url: city.type == 'external' ? city.url : `/${city.url}`,
                name: city.name,
                type: city.type
              }
            }).sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: 'base'
            })
          })
          this.loading = false 
         })
  },
}
</script>

<style lang="scss">
@import '../../assets/styles/common/_variables.scss';

.city-item-margin-top {
  margin-top: 24px;
}
.city-item-icon-right-margin {
  margin-right: 8px;
  max-width: 64px;
}
.loading-right-margin {
  margin-right: 8px;
}
</style>
