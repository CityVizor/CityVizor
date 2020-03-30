package digital.cesko.city_search

import digital.cesko.AbstractSpringTest
import net.javacrumbs.jsonunit.assertj.JsonAssertions.assertThatJson
import net.javacrumbs.jsonunit.spring.jsonContent
import org.assertj.core.api.Assertions.assertThat
import kotlin.test.Test

class CitySearchTest : AbstractSpringTest() {

    @Test
    fun testCitySearch() {
        get("/api/v2/service/citysearch?query=jilove+u+prahy").andExpect {
            status { isOk }
            jsonContent {
                inPath("\$.[?(@.ico=='00241326')]").isNotNull()
            }
        }
    }

    @Test
    fun testSearchKnownCity() {
        get("/api/v2/service/citysearch?query=Cernosice").andExpect {
            status { isOk }
            jsonContent {
                inPath("\$.[?(@.ico=='00241326')]").isNotNull()
                node("[0]").isEqualTo(
                    """
                {
                   "adresaUradu":{
                      "adresniBod":"6506836",
                      "castObce":"Černošice",
                      "cisloDomovni":"259",
                      "kraj":"Středočeský",
                      "obecKod":"539139",
                      "obec":"Černošice",
                      "ulice":"Karlštejnská",
                      "castObce": "Černošice",
                      "cisloOrientacni": null,
                      "PSC":"25228"

                    },
                    "datovaSchrankaID":"u46bwy4",
                    "mail": [
                      "podatelna@mestocernosice.cz"
                    ],
                    "nazev":"MĚSTO ČERNOŠICE",
                    "hezkyNazev": "Černošice",
                    "souradnice":[
                      49.95886668901324,
                      14.320428348540815
                    ],
                    "zkratka":"CERNOSICE",
                    "urlCityVizor":"https://www.cityvizor.cz/cernosice/",
                    "urlZnak":"https://www.cityvizor.cz/api/public/profiles/3/avatar",
                    "pocetObyvatel":0,
                    "eDeskyID":"139",
                    "ICO":"00241121"
                }
                """)
            }
        }
    }

    @Test
    fun testSearchPraha() {
        get("/api/v2/service/citysearch?query=Praha 1").andExpect {
            status { isOk }
            jsonContent {
                node("[0].ICO").isString().isEqualTo("00063410")
            }
        }
    }
}
