import * as React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Slider from "@mui/material/Slider"

const units = [
    "/Rating/1.png",
    "/Rating/2.png",
    "/Rating/3.png",
    "/Rating/4.png",
    "/Rating/5.png"
]

export default function Rating() {
    const [value, setValue] = React.useState(5.0)

    const handleChange = (event, newValue) => {
        if (typeof newValue === "number") {
            setValue(newValue)
        }
    }

    const imgIndex = Math.min(Math.floor(value / 2), units.length - 1)

    return (
        <Box sx={{ width: 307 }}>
            <Typography gutterBottom>
                <div className="flex justify-between text-white relative top-3">
                    <div className="font-bold text-xs">RATE US</div>
                    <div className="font-bold text-xs">{value.toFixed(1)}</div>
                </div>
            </Typography>

            <div className="flex justify-center mb-3">
                <img
                    src={units[imgIndex]}
                    alt={`Rating ${imgIndex + 1}`}
                    className="w-10 h-10"
                />
            </div>

            <Slider
                value={value}
                min={0}
                step={0.1}
                max={10}
                onChange={handleChange}
                sx={{
                    color: "rgb(242, 183, 5)",
                    "& .MuiSlider-thumb": {
                        height: "1.5rem",
                        width: "1.5rem",
                        border: "none",
                        backgroundColor: "white",
                        boxShadow: "0 0 10px rgba(242, 183, 5, 0.8)",
                        "&:hover, &.Mui-focusVisible": {
                            boxShadow: "0 0 15px rgba(242, 183, 5, 1)",
                        },
                    },
                    "& .MuiSlider-rail": {
                        opacity: 0.3,
                    },
                }}
            />
        </Box>
    )
}
