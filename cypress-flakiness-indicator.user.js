// ==UserScript==
// @name         Cypress Flakiness Indicator
// @namespace    http://tampermonkey.net/
// @version      2024-08-06
// @description  Displays previous runs in Cypress overview in order to easily determine flakiness
// @author       Pierre Rolland
// @match        https://cloud.cypress.io/projects/*/runs/*/overview*
// @icon         https://static-00.iconduck.com/assets.00/cypress-icon-256x256-o4n9txyw.png
// @grant        none
// ==/UserScript==

const fetchPreviousRuns = async (testResultId, projectId) => {
    const result = await fetch(
        'https://cloud.cypress.io/graphql', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "operationName": "DrawerTestResultPreviousRuns",
                "variables": {
                    "id": testResultId,
                    "projectId": projectId
                },
                "query": "query DrawerTestResultPreviousRuns($id: String!, $projectId: String!) {\n  testResult(id: $id) {\n    id\n    latestRuns {\n      id\n      buildId\n      buildNumber\n      buildStatus\n      commitBranch\n      testStatus\n      testIsFlaky\n      buildCreatedAt\n      __typename\n    }\n    history {\n      nodes {\n        id\n        modificationType\n        run {\n          id\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  project(id: $projectId) {\n    id\n    defaultBranch\n    __typename\n  }\n}\n"
            })
        }
    )
    const response = await result.json()

    return response.data.testResult.latestRuns.map(r => r.testStatus).reverse()
}

const fetchTestsForReview = async (runId) => {
    const result = await fetch(
        'https://cloud.cypress.io/graphql', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "operationName": "TestsForReview",
                "variables": {
                    "runId": runId,
                    "viewBy": null,
                    "sortBy": "STATUS",
                    "page": 1,
                    "perPage": 30
                },
                "query": "query TestsForReview($runId: String!, $viewBy: TestsForReviewViewByEnum, $perPage: Int!, $page: Int!, $sortBy: TestsForReviewSortByEnum) {\n  run(id: $runId) {\n    id\n    status\n    buildNumber\n    project {\n      id\n      organizationInfo {\n        id\n        subscription {\n          id\n          features {\n            flakeUX\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    totalPassed\n    totalFailed\n    totalSkipped\n    totalPending\n    totalFlakyTests\n    commit {\n      authorAvatar\n      authorName\n      branch\n      message\n      __typename\n    }\n    totalDuration\n    runningDuration\n    createdAt\n    testsForReview {\n      failedCount\n      flakyCount\n      totalCount\n      modifiedCount\n      specFiles(\n        input: {viewBy: $viewBy, perPage: $perPage, page: $page, sortBy: $sortBy}\n      ) {\n        nodes {\n          id\n          totalPassed\n          totalFailed\n          totalPending\n          basename\n          extension\n          path\n          shortPath\n          testResults {\n            id\n            title\n            isFlaky\n            state\n            duration\n            titleHash\n            titleParts\n            bodyHash\n            videoTimestamp\n            testId\n            hasAssociatedJiraIssues\n            lastModification(scope: RUN) {\n              type\n              __typename\n            }\n            instance {\n              id\n              duration\n              testingTypeEnum\n              spec {\n                id\n                basename\n                __typename\n              }\n              os {\n                name\n                version\n                __typename\n              }\n              browser {\n                name\n                version\n                formattedNameWithVersion\n                formattedName\n                __typename\n              }\n              group {\n                id\n                name\n                browser {\n                  formattedNameWithVersion\n                  __typename\n                }\n                os {\n                  nameWithVersion\n                  __typename\n                }\n                __typename\n              }\n              __typename\n            }\n            capture {\n              status\n              __typename\n            }\n            run {\n              id\n              isHiddenByUsageLimits\n              isPastDataRetention\n              configTestReplayEnabled\n              cypressVersion\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
            })
        }
    )
    const response = await result.json()

    return response.data.run.testsForReview.specFiles.nodes
}

const getErrorFromTestResult = (testResult) => {
    const errorPhrase = testResult.errorDetails?.summary
    if (!errorPhrase) {
        return
    }
    const err = errorPhrase.split('\n').shift()
    return err
}

const fetchTestResult = async (testResultId) => {
    const result = await fetch(
        'https://cloud.cypress.io/graphql', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "operationName":"DrawerTestResult",
                "variables": {
                    "id": testResultId
                },
                "query": "query DrawerTestResult($id: String!) {\n  testResult(id: $id) {\n    id\n    state\n    titleParts\n    isFlaky\n    duration\n    specHash\n    titleHash\n    screenshots {\n      nodes {\n        id\n        width\n        height\n        title\n        publicThumbnailUrl\n        fullResolutionUrl\n        __typename\n      }\n      __typename\n    }\n    video {\n      id\n      videoUrl\n      __typename\n    }\n    videoTimestamp\n    errorDetails {\n      summary\n      __typename\n    }\n    lastModification {\n      type\n      modifiedAt\n      __typename\n    }\n    attempts {\n      id\n      state\n      videoTimestamp\n      attemptNumber\n      errorDetails {\n        name\n        message\n        impactedTestCasesCount\n        codeFrame {\n          line\n          column\n          originalFile\n          repositoryFileUrl\n          frame\n          language\n          __typename\n        }\n        __typename\n      }\n      screenshot {\n        id\n        width\n        height\n        title\n        publicThumbnailUrl\n        fullResolutionUrl\n        __typename\n      }\n      __typename\n    }\n    definition {\n      test {\n        body\n        duration\n        __typename\n      }\n      hooks {\n        id\n        duration\n        name\n        body\n        __typename\n      }\n      __typename\n    }\n    instance {\n      id\n      spec {\n        id\n        basename\n        path\n        __typename\n      }\n      os {\n        name\n        version\n        __typename\n      }\n      browser {\n        name\n        version\n        formattedNameWithVersion\n        formattedName\n        __typename\n      }\n      group {\n        id\n        name\n        __typename\n      }\n      status\n      duration\n      completedAt\n      hasStdout\n      run {\n        id\n        commit {\n          authorName\n          authorEmail\n          authorAvatar\n          branch\n          branchUrl\n          sha\n          url\n          message\n          __typename\n        }\n        status\n        buildNumber\n        totalPassed\n        totalFailed\n        totalSkipped\n        totalPending\n        totalFlakyTests\n        totalDuration\n        runningDuration\n        createdAt\n        project {\n          id\n          organizationInfo {\n            id\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    run {\n      id\n      isHiddenByUsageLimits\n      isPastDataRetention\n      configTestReplayEnabled\n      cypressVersion\n      __typename\n    }\n    appliedMuteOrchestration {\n      id\n      action\n      createdAt\n      createdBy {\n        id\n        avatar\n        name\n        __typename\n      }\n      __typename\n    }\n    activeMuteOrchestration {\n      id\n      __typename\n    }\n    capture {\n      status\n      __typename\n    }\n    __typename\n  }\n}\n"
            })
        }
    )
    const response = await result.json()

    return response.data.testResult
}

const fetchRunId = async (buildNumber, projectId) => {
    const result = await fetch(
        'https://cloud.cypress.io/graphql', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "x-cy-pathname": `/projects/${projectId}/runs/${buildNumber}/overview`
            },
            body: JSON.stringify({
                "operationName": "RunContainer",
                "variables": {
                    "buildNumber": buildNumber,
                    "buildId": buildNumber,
                    "projectId": projectId,
                    "queryById": false,
                    "intelligenceEnabled": false,
                    "accessibilityFlagEnabled": false,
                    "interactivityFlagEnabled": false
                },
                "query": "query RunContainer($buildNumber: ID!, $projectId: String!, $buildId: String!, $queryById: Boolean!, $intelligenceEnabled: Boolean!, $accessibilityFlagEnabled: Boolean!, $interactivityFlagEnabled: Boolean!) {\n  runByBuildNumber(buildNumber: $buildNumber, projectId: $projectId) @skip(if: $queryById) {\n    id\n    configTestReplayEnabled\n    runningDuration\n    supportsLoadBalancing\n    hiddenUntil\n    isHiddenByUsageLimits\n    isPastDataRetention\n    specPattern\n    estimatedSavedTimeByCancelOnFailure\n    instances {\n      nodes {\n        id\n        status\n        completedAt\n        totalPassed\n        totalFailed\n        totalPending\n        totalSkipped\n        totalFlakyTests\n        totalMutedTests\n        testingType\n        duration\n        createdAt\n        claimedAt\n        hasStdout\n        machineId\n        postProcessingCompletedAt\n        wallClockStartedAt\n        wallClockEndedAt\n        estimatedWallClockDuration\n        error\n        parallelEnabled\n        prioritizedByFailedSpecs\n        group {\n          id\n          name\n          __typename\n        }\n        spec {\n          id\n          path\n          shortPath\n          __typename\n        }\n        video {\n          id\n          videoUrl\n          __typename\n        }\n        browser {\n          name\n          version\n          __typename\n        }\n        os {\n          name\n          version\n          __typename\n        }\n        __typename\n      }\n      totalCount\n      __typename\n    }\n    integrationBranch\n    isUsingRetries\n    createdAt\n    status\n    buildNumber\n    runnerCapabilities {\n      muteTestAction\n      __typename\n    }\n    e2eSpecCount\n    componentSpecCount\n    cypressVersion\n    totalPassed\n    totalFailed\n    totalSkipped\n    totalPending\n    totalFlakyTests\n    commit {\n      authorAvatar\n      authorName\n      branch\n      message\n      summary\n      branchUrl\n      authorEmail\n      sha\n      url\n      __typename\n    }\n    totalDuration\n    project {\n      id\n      organizationInfo {\n        id\n        subscription {\n          id\n          features {\n            flakeDetection\n            flakeUX\n            __typename\n          }\n          __typename\n        }\n        viewerIsOwnerOrAdmin\n        __typename\n      }\n      name\n      eligibleForClearStatusChecks\n      cancelBuildOnFailure\n      cancelBuildOnFailureCount\n      prioritizeFailedSpecs\n      runCompletionDelay\n      isUsingRetries\n      hasRecordedRuns\n      hasRecordedRunsInCi\n      intendedCIProviders {\n        id\n        key\n        name\n        __typename\n      }\n      shouldUpdateCypressVersion5\n      __typename\n    }\n    onlySpec\n    totalTests\n    specIsolation\n    startTime\n    scheduledToCompleteAt\n    parallelizationDisabled\n    cancelledAt\n    endTime\n    archivedAt\n    hasTestOrchestrationEnabled\n    completedInstanceCount\n    cancelOnFailure\n    settingPrioritizedByFailedSpecs\n    projectCancelOnFailureCount\n    settingCancelOnFailureCount\n    settingCancelOnFailure\n    totalSavedByParallelization\n    machineCount\n    archivedBy {\n      id\n      name\n      __typename\n    }\n    cancelledBy {\n      id\n      avatar\n      name\n      __typename\n    }\n    ci {\n      ciBuildId\n      provider\n      ciBuildNumber\n      ciBuildNumberFormatted\n      isCustomCiBuildId\n      formattedProvider\n      url\n      pullRequestNumber\n      pullRequestUrl\n      __typename\n    }\n    tags {\n      id\n      name\n      color\n      __typename\n    }\n    uniqueBrowsers {\n      formattedName\n      unformattedVersion\n      __typename\n    }\n    uniqueOses {\n      name\n      version\n      unformattedName\n      __typename\n    }\n    firstViewedAt\n    runUsedToPrioritizeSpecs {\n      id\n      buildNumber\n      __typename\n    }\n    totalRunning\n    totalMutedTests\n    prioritizedByFailedSpecs\n    accessibilityResults @include(if: $accessibilityFlagEnabled) {\n      status\n      processedInstanceCount\n      coveragePercent\n      issues {\n        instanceId\n        status\n        __typename\n      }\n      __typename\n    }\n    uiCoverageResults @include(if: $interactivityFlagEnabled) {\n      status\n      processedInstanceCount\n      coveragePercent\n      issues {\n        instanceId\n        status\n        __typename\n      }\n      __typename\n    }\n    appQualityConfiguration @include(if: $intelligenceEnabled) {\n      updatedAt\n      config\n      minBuildWithSameConfig\n      isLatestConfig\n      configSchemaVersion\n      __typename\n    }\n    __typename\n  }\n  run(id: $buildId) @include(if: $queryById) {\n    id\n    configTestReplayEnabled\n    runningDuration\n    supportsLoadBalancing\n    hiddenUntil\n    isHiddenByUsageLimits\n    isPastDataRetention\n    specPattern\n    estimatedSavedTimeByCancelOnFailure\n    instances {\n      nodes {\n        id\n        status\n        completedAt\n        totalPassed\n        totalFailed\n        totalPending\n        totalSkipped\n        totalFlakyTests\n        totalMutedTests\n        testingType\n        duration\n        createdAt\n        claimedAt\n        hasStdout\n        machineId\n        postProcessingCompletedAt\n        wallClockStartedAt\n        wallClockEndedAt\n        estimatedWallClockDuration\n        error\n        parallelEnabled\n        prioritizedByFailedSpecs\n        group {\n          id\n          name\n          __typename\n        }\n        spec {\n          id\n          path\n          shortPath\n          __typename\n        }\n        video {\n          id\n          videoUrl\n          __typename\n        }\n        browser {\n          name\n          version\n          __typename\n        }\n        os {\n          name\n          version\n          __typename\n        }\n        __typename\n      }\n      totalCount\n      __typename\n    }\n    integrationBranch\n    isUsingRetries\n    createdAt\n    status\n    buildNumber\n    runnerCapabilities {\n      muteTestAction\n      __typename\n    }\n    e2eSpecCount\n    componentSpecCount\n    cypressVersion\n    totalPassed\n    totalFailed\n    totalSkipped\n    totalPending\n    totalFlakyTests\n    commit {\n      authorAvatar\n      authorName\n      branch\n      message\n      summary\n      branchUrl\n      authorEmail\n      sha\n      url\n      __typename\n    }\n    totalDuration\n    project {\n      id\n      organizationInfo {\n        id\n        subscription {\n          id\n          features {\n            flakeDetection\n            flakeUX\n            __typename\n          }\n          __typename\n        }\n        viewerIsOwnerOrAdmin\n        __typename\n      }\n      name\n      eligibleForClearStatusChecks\n      cancelBuildOnFailure\n      cancelBuildOnFailureCount\n      prioritizeFailedSpecs\n      runCompletionDelay\n      isUsingRetries\n      hasRecordedRuns\n      hasRecordedRunsInCi\n      intendedCIProviders {\n        id\n        key\n        name\n        __typename\n      }\n      shouldUpdateCypressVersion5\n      __typename\n    }\n    onlySpec\n    totalTests\n    specIsolation\n    startTime\n    scheduledToCompleteAt\n    parallelizationDisabled\n    cancelledAt\n    endTime\n    archivedAt\n    hasTestOrchestrationEnabled\n    completedInstanceCount\n    cancelOnFailure\n    settingPrioritizedByFailedSpecs\n    projectCancelOnFailureCount\n    settingCancelOnFailureCount\n    settingCancelOnFailure\n    totalSavedByParallelization\n    machineCount\n    archivedBy {\n      id\n      name\n      __typename\n    }\n    cancelledBy {\n      id\n      avatar\n      name\n      __typename\n    }\n    ci {\n      ciBuildId\n      provider\n      ciBuildNumber\n      ciBuildNumberFormatted\n      isCustomCiBuildId\n      formattedProvider\n      url\n      pullRequestNumber\n      pullRequestUrl\n      __typename\n    }\n    tags {\n      id\n      name\n      color\n      __typename\n    }\n    uniqueBrowsers {\n      formattedName\n      unformattedVersion\n      __typename\n    }\n    uniqueOses {\n      name\n      version\n      unformattedName\n      __typename\n    }\n    firstViewedAt\n    runUsedToPrioritizeSpecs {\n      id\n      buildNumber\n      __typename\n    }\n    totalRunning\n    totalMutedTests\n    prioritizedByFailedSpecs\n    accessibilityResults @include(if: $accessibilityFlagEnabled) {\n      status\n      processedInstanceCount\n      coveragePercent\n      issues {\n        instanceId\n        status\n        __typename\n      }\n      __typename\n    }\n    uiCoverageResults @include(if: $interactivityFlagEnabled) {\n      status\n      processedInstanceCount\n      coveragePercent\n      issues {\n        instanceId\n        status\n        __typename\n      }\n      __typename\n    }\n    appQualityConfiguration @include(if: $intelligenceEnabled) {\n      updatedAt\n      config\n      minBuildWithSameConfig\n      isLatestConfig\n      configSchemaVersion\n      __typename\n    }\n    __typename\n  }\n}\n"
            })
        }
    )
    const response = await result.json()

    return response.data.runByBuildNumber.id
}

const extractBuildNumberAndProjectId = () => {
    const re = /^https:\/\/cloud\.cypress\.io\/projects\/([a-z0-9]+)\/runs\/(\d+)\/overview/
    const matches = window.location.href.match(re)

    if (matches.length < 3) {
        return {
            projectId: false,
            buildNumber: false
        }
    }

    return {
        projectId: matches[1],
        buildNumber: matches[2]
    }
}

const findGroupElement = (basename) => {
    const groupElements = document.querySelectorAll('[data-cy=tests-for-review-spec-card]')

    for (const groupElement of groupElements) {
        const desc = groupElement.querySelector('[data-cy=spec-card-filename]')

       if (desc.innerText === basename) {
           return groupElement
       }
    }
}

const findTestElement = (id, groupElement) => {
    return groupElement.querySelectorAll('[data-cy=parent-test-row-wrapper]')[id]
}

const createTestResultChip = (result) => {
    const colors = {
        'PASSED': '#1dd1a1',
        'FAILED': '#fc5c65',
        'SKIPPED': '#a5b1c2'
    }
    const element = document.createElement('div')

    element.style.width = '8px'
    element.style.height = '8px'
    element.style.background = colors[result]
    element.style.display = 'inline-block'
    element.style.borderRadius = '4px'
    element.style.margin = '0 1px 0 0'

    return element
}

const createTestResultSummary = (results) => {
    const element = document.createElement('div')

    element.style.padding = '0 4px'
    element.style.borderRadius = '4px'
    element.style.background = '#EEE'

    for (const result of results) {
        element.appendChild(createTestResultChip(result))
    }

    return element
}

const createErrorHighlightElement = (error) => {
    const element = document.createElement('div')
    element.style.margin = '0 0 0 1em'
    element.style.color = '#5a5f7a'
    element.style.fontStyle = 'italic'
    element.textContent = `ℹ️ ${error}`
    return element
}

const guessTestResultColor = (testResults) => {
    if (testResults.filter((r) => r !== 'FAILED').length === 0) {
        return '#20bf6b'
    }

    if (testResults.slice(0, -1).filter((r) => r !== 'PASSED').length === 0) {
        return '#e15f41'
    }

    return '#feca57'
}

const createExtraInfoElement = ({ previousRuns, error }) => {
    const element = document.createElement('div')
    element.style.display = 'flex'
    element.style.position = 'absolute'
    element.style.bottom = '3px'
    element.style.flexFlow = 'row'

    element.appendChild(createTestResultSummary(previousRuns))
    element.appendChild(createErrorHighlightElement(error))

    return element
}

const handleTestResult = async (id, testResult, groupElement, projectId) => {
    if (testResult.state !== 'FAILED') {
        return
    }

    const testElement = findTestElement(id, groupElement)
    const previousRuns = await fetchPreviousRuns(testResult.id, projectId)
    const testResultDetailed = await fetchTestResult(testResult.id)
    const error = getErrorFromTestResult(testResultDetailed)

    testElement.style.position = 'relative'
    testElement.style.paddingBottom = '36px'
    testElement.style.backgroundColor = guessTestResultColor(previousRuns)

    testElement.appendChild(createExtraInfoElement({previousRuns, error}))
}

const handleGroup = (node, projectId) => {
    const groupElement = findGroupElement(node.basename)

    for (const id in node.testResults) {
        handleTestResult(id, node.testResults[id], groupElement, projectId)
    }
}

const execute = async (testsForReview, projectId) => {
    for (const node of testsForReview) {
        handleGroup(node, projectId)
    }
}

(async function() {
    'use strict';

    const { buildNumber, projectId } = extractBuildNumberAndProjectId()

    if (!buildNumber || !projectId) {
        return
    }

    const runId = await fetchRunId(buildNumber, projectId)
    const testsForReview = await fetchTestsForReview(runId)

    setTimeout(() => execute(testsForReview, projectId), 3000)
})()