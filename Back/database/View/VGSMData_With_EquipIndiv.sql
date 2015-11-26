
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



ALTER View [dbo].[VGSMData_With_EquipIndiv] as (

SELECT t.FK_Individual,s.ID as FK_Sensor,t.StartDate,t.EndDate,
	a.DateTime as date,
	a.Latitude_N as lat, 
	a.Longitude_E as lon,
	a.Altitude_m as ele,
	'gsm' as type,
	a.Speed as speed,
	a.Course as course,
	a.platform_ as FK_ptt,
	a.HDOP as hdop,
	a.VDOP as vdop,
	a.SatelliteCount,
	a.file_date,
	a.checked,
	a.imported,
	a.validated,
	a.PK_id

  FROM [ecoReleve_Sensor].[dbo].[Tgsm] a
  JOIN Sensor s ON CONVERT(VARCHAR,a.platform_) = s.UnicIdentifier 
  LEFT JOIN (
	SELECT e.*,e1.StartDate as EndDate  FROM 
	equipment e 
	LEFT JOIN equipment e1 
	ON e.FK_Individual = e1.FK_Individual AND e.FK_Sensor =  e1.FK_Sensor AND e.StartDate < e1.StartDate AND e.ID != e1.ID AND e.Deploy != e1.Deploy
	WHERE  e.Deploy = 1) t 
  ON s.ID = t.FK_Sensor AND a.DateTime >= t.StartDate AND (a.DateTime < t.EndDate OR t.EndDate IS NULL)
   WHERE a.Longitude_E IS NOT NULL AND a.Latitude_N IS NOT NULL AND (a.HDOP >= 6 
	OR a.VDOP BETWEEN 1 AND 10 
	OR a.SatelliteCount >=5 )
  )







GO


