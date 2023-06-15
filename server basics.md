server basics
2. ok
7.  
-> verify using newly created view. "the first page contains 250 members" (default is 100 dus aanpassen)
19. verify url naming 
-> i configure a view by time. Expected 200 is now 201 
-> Verify Acceptable Fragment Formats andere naam als by-page gebruiken

"@prefix ldes:       <https://w3id.org/ldes#> .
@prefix mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#> .
@prefix rdf:        <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix shacl:      <http://www.w3.org/ns/shacl#> .
@prefix tree:       <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances>
        rdf:type    ldes:EventStream ;
        <http://example.org/memberType>
                mobiliteit:Mobiliteitshinder ;
        tree:shape  [ rdf:type  shacl:NodeShape ] .
Shacl validation failed: 

@prefix ldes:   <https://w3id.org/ldes#> .
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh:     <http://www.w3.org/ns/shacl#> .
@prefix tree:   <https://w3id.org/tree#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .

[ rdf:type     sh:ValidationReport ;
  sh:conforms  false ;
  sh:result    [ rdf:type                      sh:ValidationResult ;
                 sh:focusNode                  []  ;
                 sh:resultMessage              "minCount[1]: Invalid cardinality: expected min 1: Got count = 0" ;
                 sh:resultPath                 tree:fragmentationPath ;
                 sh:resultSeverity             sh:Violation ;
                 sh:sourceConstraintComponent  sh:MinCountConstraintComponent ;
                 sh:sourceShape                tree:FragmentationPath
               ]
] ."

27. 
-> 'jq' is not recognized as an internal or external command,\r\noperable program or batch file

30. proberrt by-time op te halen terwijl die niet bestaat

"@prefix default-context: <https://uri.etsi.org/ngsi-ld/default-context/> .
@prefix ldes:            <https://w3id.org/ldes#> .
@prefix prov:            <http://www.w3.org/ns/prov#> .
@prefix rdf:             <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix shacl:           <http://www.w3.org/ns/shacl#> .
@prefix terms:           <http://purl.org/dc/terms/> .
@prefix tree:            <https://w3id.org/tree#> .

<http://localhost:8080/device-models>
        rdf:type            ldes:EventStream ;
        <http://example.org/memberType>
                default-context:DeviceModel ;
        ldes:timestampPath  prov:generatedAtTime ;
        ldes:versionOfPath  terms:isVersionOf ;
        tree:shape          [ rdf:type  shacl:NodeShape ] .
Shacl validation failed: 

@prefix ldes:   <https://w3id.org/ldes#> .
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh:     <http://www.w3.org/ns/shacl#> .
@prefix tree:   <https://w3id.org/tree#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .

[ rdf:type     sh:ValidationReport ;
  sh:conforms  false ;
  sh:result    [ rdf:type                      sh:ValidationResult ;
                 sh:focusNode                  []  ;
                 sh:resultMessage              "minCount[1]: Invalid cardinality: expected min 1: Got count = 0" ;
                 sh:resultPath                 tree:fragmentationPath ;
                 sh:resultSeverity             sh:Violation ;
                 sh:sourceConstraintComponent  sh:MinCountConstraintComponent ;
                 sh:sourceShape                tree:FragmentationPath
               ]
] .
@prefix default-context: <https://uri.etsi.org/ngsi-ld/default-context/> .
@prefix ldes:            <https://w3id.org/ldes#> .
@prefix prov:            <http://www.w3.org/ns/prov#> .
@prefix rdf:             <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix shacl:           <http://www.w3.org/ns/shacl#> .
@prefix terms:           <http://purl.org/dc/terms/> .
@prefix tree:            <https://w3id.org/tree#> .

<http://localhost:8080/devices>
        rdf:type            ldes:EventStream ;
        <http://example.org/memberType>
                default-context:Device ;
        ldes:timestampPath  prov:generatedAtTime ;
        ldes:versionOfPath  terms:isVersionOf ;
        tree:shape          [ rdf:type  shacl:NodeShape ] .
Shacl validation failed: 

@prefix ldes:   <https://w3id.org/ldes#> .
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh:     <http://www.w3.org/ns/shacl#> .
@prefix tree:   <https://w3id.org/tree#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .

[ rdf:type     sh:ValidationReport ;
  sh:conforms  false ;
  sh:result    [ rdf:type                      sh:ValidationResult ;
                 sh:focusNode                  []  ;
                 sh:resultMessage              "minCount[1]: Invalid cardinality: expected min 1: Got count = 0" ;
                 sh:resultPath                 tree:fragmentationPath ;
                 sh:resultSeverity             sh:Violation ;
                 sh:sourceConstraintComponent  sh:MinCountConstraintComponent ;
                 sh:sourceShape                tree:FragmentationPath
               ]
] .
@prefix ldes:  <https://w3id.org/ldes#> .
@prefix prov:  <http://www.w3.org/ns/prov#> .
@prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix shacl: <http://www.w3.org/ns/shacl#> .
@prefix sosa:  <http://www.w3.org/ns/sosa/> .
@prefix terms: <http://purl.org/dc/terms/> .
@prefix tree:  <https://w3id.org/tree#> .

<http://localhost:8080/water-quality-observations>
        rdf:type            ldes:EventStream ;
        <http://example.org/memberType>
                sosa:ObservationCollection ;
        ldes:timestampPath  prov:generatedAtTime ;
        ldes:versionOfPath  terms:isVersionOf ;
        tree:shape          [ rdf:type  shacl:NodeShape ] .
Shacl validation failed: 

@prefix ldes:   <https://w3id.org/ldes#> .
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix sh:     <http://www.w3.org/ns/shacl#> .
@prefix tree:   <https://w3id.org/tree#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .

[ rdf:type     sh:ValidationReport ;
  sh:conforms  false ;
  sh:result    [ rdf:type                      sh:ValidationResult ;
                 sh:focusNode                  []  ;
                 sh:resultMessage              "minCount[1]: Invalid cardinality: expected min 1: Got count = 0" ;
                 sh:resultPath                 tree:fragmentationPath ;
                 sh:resultSeverity             sh:Violation ;
                 sh:sourceConstraintComponent  sh:MinCountConstraintComponent ;
                 sh:sourceShape                tree:FragmentationPath
               ]
] ."

-> moet de shacl zo hard zijn ?